PRODUCT REQUIREMENTS DOCUMENT
CMP Autobot, MOG-APL Mapper

Version	2.0
Date	March 4, 2026
Status	Draft
Owner	CMP Product Team
Stakeholders	Culinary / Menu Planning, Procurement, Site Operations, Finance, Technology
Classification	Confidential. For intended audience only


1. Overview
1.1 Purpose
This document defines the requirements for an AI-powered Agentic system, the CMP Autobot, MOG-APL Mapper, that automatically detects APL changes in SAP (via the ODS nightly feed) and synchronises the MOG-APL mappings in CookBook, eliminating the current dependency on manual human intervention to keep recipe cost data accurate and current.

1.2 Background and Context
CookBook is Compass Group India's homegrown Kitchen ERP that holds the MOG (Managed Order Guide) Master, the culinary specification of every generic ingredient used across recipes at all sites. Each MOG is linked to one or more APLs (Approved Product Lists), the procurement specification of that MOG, which carry Brand, Pack Size, and Cost information sourced from SAP.
This MOG-APL linkage is the foundation upon which Recipe Costing is computed. When a recipe is detailed in CookBook with a list of MOGs and their quantities, the system deduces the cost of that recipe for a given yield only because each MOG is connected to an APL with a known cost.
The Problem: APLs are dynamic. Procurement continuously optimises for the best available rate, and as a result, the APL active at a site changes over time. SAP reflects these changes in real time. CookBook, however, has no native mechanism to receive or reflect these changes. The result is APL Staleness in CookBook: recipe costs continue to be computed against old, superseded APLs, making Food Cost data unreliable, a critical problem given that Food Cost sits at the centre of business operations and financial performance.
The manual fix, delinking old APLs and connecting new ones in CookBook, is theoretically simple but operationally impossible at scale: thousands of APLs, thousands of MOGs, approximately 400 sites, and site teams already operating under the pressure of daily production and customer service. This is the problem this Autobot is designed to solve.

1.3 Goals
•Automatically detect APL changes arriving from SAP into the ODS on a nightly cycle
•Intelligently match updated APLs to their corresponding MOGs using business rules
•Route every MOG-APL mapping outcome into the appropriate queue, Green, Amber, Red, or Blue
•Present queue outputs with substantiated, human-readable explanations for CMP Team review and action
•Track mapping progress against a target date, separately accounting for incremental workload additions
•Detect APL retirement events and flag affected MOG mappings for transition planning without breaking live recipe costing
•Maintain the accuracy and integrity of Recipe Costing data across all sites

1.4 Non-Goals
•This Autobot does not manage procurement decisions or approve new APLs in SAP
•This Autobot does not modify the MOG Master, culinary specifications remain Culinary's domain
•This Autobot does not replace the APL creation or maintenance process in SAP
•This Autobot does not handle recipe creation, modification, or yield calculations
•Direct posting into CookBook is not in scope for V1, it is a V2 roadmap item
•Purchasing logic, supplier management, or cost negotiation are out of scope

1.5 Version Scope
Capability	V1 (This Document)	V2 (Future Roadmap)
Queue classification (Green / Amber / Red / Blue)	In scope	In scope
Substantiated explanation per queue assignment	In scope	In scope
HITL review queue for Amber	In scope	In scope
MAM Exception 1 detection and surfacing	In scope	In scope
APL retirement detection, Blue Queue	In scope	In scope
Progress dashboard and incremental workload tracking	In scope	In scope
CookBook posting for Green / Amber items	Manual by CMP Team	Auto-posted via MCP API
APL delink on retirement confirmation	Manual by CMP Team	Auto-executed via MCP API
APL replacement linking on Blue → Green/Amber resolution	Manual by CMP Team	Auto-executed via MCP API

2. Domain Knowledge, For Engineering Teams New to Compass
This section is intended specifically for engineering teams unfamiliar with Compass Group India's culinary and procurement operations. Understanding these concepts is essential to building the CMP Autobot correctly. Do not skip this section.

2.1 What is an MOG?
Definition: An MOG (Managed Order Guide) is a Culinary Specification of a Generic Ingredient.
At the base level there is a Generic Ingredient, the most basic, elementary, and universally understood form of an ingredient. Examples: Atta, Sugar, Salt, Chilli, Butter, Cardamom. Above that sits the MOG, the specific, precise form of that generic ingredient as defined by the Culinary team. Examples: Granular Sugar (not just Sugar), Iodized Salt (not just Salt), Cardamom Powder (not just Cardamom).
Why Culinary defines it: Because the exact form of an ingredient directly impacts the dish's attributes, Flavour, Consistency, Yield, Texture, and Appearance. Culinary owns the specification because they are the custodians of how the dish must turn out.

Important: An MOG is not recipe-specific. The same MOG can be used across multiple recipes. Iodized Salt may be used in both Butter Chicken and Palak Paneer. The MOG defines what the ingredient is, not where it is used.

2.2 Types of MOGs
Elementary MOG, A single, specific form of a generic ingredient used directly into the cooking process as-is. Examples: Granular Sugar, Iodized Salt, Cardamom Powder, Turmeric Whole, Cashew Whole, Cashew Broken, Ginger Fresh, Garlic Fresh.

Note: Cashew Whole and Cashew Broken are two separate MOGs, not two APLs of one MOG. Whole is used where presentation matters (e.g., Kaju Pulao). Broken is used where the cashew is processed into a paste and its physical form is irrelevant. Each is a distinct culinary specification with its own APL(s).

Composite MOG, A blend of two or more ingredients, procured as a packed product from the market, used directly into the cooking process. Examples: Garam Masala Powder (market-procured), Ginger Garlic Paste (market-procured), Panchforon Masala (market-procured).

Critical rule: The same product can be a Composite MOG or not, depending on origin. Garam Masala Powder bought as an Everest packet from the market = MOG. Garam Masala Powder prepared inhouse by the kitchen = NOT an MOG. An MOG must always be market-sourced and used as a direct ingredient into cooking.

On Ginger Garlic Paste: Ginger is a generic ingredient, its MOG is Ginger Fresh. Garlic is a generic ingredient, its MOG is Garlic Fresh. When blended and procured as a market-sourced paste, the resulting product (Ginger Garlic Paste) becomes a Composite MOG in its own right. It does not inherit the generic ingredient identity of its components.

2.3 What is an APL?
Definition: An APL (Approved Product List) is the Procurement Specification of an MOG.
The MOG defines what the ingredient is from a culinary lens. The APL defines how it is procured, adding brand and pack size on top of the culinary specification. Using the example "Garam Masala, Powder, Everest, 1x250 gms":

Component	Example	What it tells the supplier
Generic Product Name	Garam Masala	What to supply
Product Characteristic	Powder	Which variant to supply
Brand (or UB for Unbranded)	Everest	Whose product to supply
Pack Size	1x250 gms	Which packaging variant to supply

APL carries Cost: In Compass's master database, each APL carries its cost. This makes the APL the financial anchor of the entire recipe costing system. Without a correctly mapped APL, there is no cost to compute against a recipe.

APL Data Quality, Ground Reality: The current APL definition process in SAP is heavily human-dependent. APL records may carry missing product characteristics, missing pack sizes, or be stale placeholders created under time pressure and never purged. A parallel correction workstream is underway. The Autobot must detect and flag these anomalies rather than silently create incorrect mappings against bad data.

2.4 The MOG-APL Relationship, Mapping Rules
The relationship is directional and asymmetric:

Direction	Rule	Valid?
1 MOG → 1 APL	One-to-one mapping	✓ Valid
1 MOG → 2 or more APLs	Multiple procurement variants of the same ingredient	✓ Valid
1 APL → 1 MOG	Always, an APL carries one product identity	✓ Always true
Multiple MOGs → 1 APL	Impossible, changing the MOG changes the product, which changes the APL	✗ Never valid

The Default APL: When multiple APLs are linked to one MOG, one is designated as the default. Recipe cost is computed using the default APL's cost. The default is the lowest-cost active APL at the site. Default is site-specific, the same MOG can have different defaults at different sites. Edge cases where culinary application overrides the lowest-cost rule are to be defined during Discovery.

2.5 The Core Problem This Autobot Solves
APLs are dynamic. Procurement continuously optimises for the best available rate. APLs change when suppliers are switched, rates are renegotiated, or pack sizes are changed. SAP reflects these changes immediately. CookBook does not.
The result, APL Staleness: The moment an APL changes in SAP, the MOG-APL mapping in CookBook becomes stale. Recipes compute costs against an APL that no longer represents reality.
The fix is simple. The execution at scale is not: Delink the old APL, link the new one in CookBook. But doing this manually across thousands of APLs, thousands of MOGs, and ~400 sites while running daily food production is not a reasonable human expectation. This Autobot exists to automate that loop.

Operating rhythm: SAP data is extracted into the ODS on a nightly batch cycle via RFC API. The ODS is the Autobot's single source of truth for APL state. The Autobot runs nightly, consuming the ODS refresh and processing all mapping updates. Mappings are ready by the start of each operational day.

2.6 MAM Exception 1, Chef vs. Store Manager Dissonance
MAM Exception 1 (MAM = MOG-APL Mapping) is a real-world disconnect between Culinary and Procurement realities at a site. It has two forms:
Type A, MOG exists, no matching APL: The Chef confirms using an ingredient (MOG exists in CookBook) but the Store Manager confirms procurement has no record of buying it (no APL in SAP).
Type B, APL exists, no corresponding MOG: Procurement is buying a product (APL in SAP) but the Chef confirms it is not used in any recipe in CookBook.

The Autobot must detect, classify, and surface both types of MAM Exception 1 for human resolution. It must never force-resolve them autonomously.

2.7 System Landscape
CookBook: Compass Group India's homegrown Kitchen ERP. Holds the MOG Master, allows MOG edits, and provides the UI through which MOG-APL mappings are managed. It is the system of action, where culinary specifications, recipes, and cost computations live.
SAP: Enterprise system of record for procurement. APL data originates here. Reflects the most current procurement state at all times.
ODS (Operational Data Store): The intermediary layer. Receives APL data from SAP nightly via RFC API. The ODS is the Autobot's single source of truth, it is the detection point for all APL state changes, including Active/Inactive status. The Autobot never reads SAP directly.
MCP (Model Context Protocol): The interface through which this Autobot will connect to and act on CookBook in V2. In V1, CookBook posting is performed manually by the CMP Team based on Autobot queue outputs.

Data flow: SAP  →  RFC API  →  ODS (nightly)  →  CMP Autobot  →  Queue outputs  →  CMP Team  →  CookBook (V1 manual / V2 via MCP)

3. User Personas and Use Cases
3.1 Primary Users
CMP Autobot (Autonomous Actor): Runs nightly. Reads ODS APL data, reads MOG Master via MCP (V2) or API, applies business rules, generates queue outputs with explanations, and updates the progress dashboard.
Menu Planning / CMP Team (Oversight and Action): Reviews all four queue outputs. Actions Green Queue items into CookBook. Confirms or corrects Amber Queue items. Investigates Red Queue items. Plans for Blue Queue transitions. Manages HITL review and has rollback authority over all CookBook entries.
Site Culinary Lead / Chef: Indirectly impacted, recipe cost data stays accurate without any action required from them.
Finance / Food Cost Team: Consumers of accurate recipe costing output. High dependency on Autobot correctness.
Procurement Team: Owns APL data in SAP. Their updates, new APLs, retired APLs, cost changes, drive the Autobot's nightly actions.

3.2 Use Cases
1.UC-01: A new APL is created in SAP, Autobot detects it in the ODS nightly feed, assesses it against all MOGs, and routes each match into the appropriate queue.
2.UC-02: An existing APL is marked Inactive in the ODS, Autobot detects the retirement, flags the affected MOG mapping(s) into the Blue Queue, and preserves the existing mapping in CookBook until transition is actioned.
3.UC-03: An APL is marked Inactive in the ODS and a replacement APL arrives in the same or a subsequent nightly feed, Autobot treats this as a linked transition event, assesses the replacement, and routes into Blue + Green/Amber as appropriate.
4.UC-04: A valid MOG → APL mapping exists in CookBook, and a new APL arrives in the ODS as an additional candidate for the same MOG (existing APL still active), Autobot preserves the existing mapping and presents the additional APL as an enrichment candidate in Green or Amber queue.
5.UC-05: An APL cost is updated in SAP, the updated cost flows into ODS. Autobot flags the affected MOG-APL mapping for review if the cost change is significant.
6.UC-06: A MOG has no matching APL anywhere in the ODS, Autobot routes it to the Red Queue with explanation.
7.UC-07: A Chef reports using a MOG for which no APL exists in SAP, MAM Exception 1 Type A, flagged for human resolution.
8.UC-08: An APL exists in the ODS that no MOG in CookBook references, MAM Exception 1 Type B, flagged as orphan APL.
9.UC-09: Incremental MOGs are added to scope mid-exercise, Autobot detects new workload, adds it to the Incremental Workload block on the dashboard, and raises a callout flag.

3.3 User Stories
•As this Autobot, I want to consume the nightly ODS refresh so that I can detect all APL state changes, new, updated, and retired, reliably each day.
•As this Autobot, I want to apply business rules to match APLs to MOGs and route each outcome to the correct queue with a substantiated explanation so the CMP Team can act without ambiguity.
•As this Autobot, I want to detect when a previously Active APL becomes Inactive in the ODS and flag the affected MOG mapping into the Blue Queue, preserving the live mapping until the human actions the transition.
•As a CMP Team Member, I want to see Green Queue items presented with full mapping details so I can enter them into CookBook directly and confidently.
•As a CMP Team Member, I want to see Amber Queue items with the Autobot's reasoning so I can confirm, correct, and then enter them into CookBook.
•As a CMP Team Member, I want to see Blue Queue items with the retired APL identified and any candidate replacement flagged, so I can plan the transition before the physical stock runs out.
•As a CMP Team Member, I want to see the progress dashboard with original and incremental workload separated, so I can understand my true completion status against the target date.
•As a Finance Analyst, I want recipe costing in CookBook to always reflect live APL costs from SAP so that Food Cost reports are accurate and trustworthy.

4. The Four-Queue Classification System
The Autobot classifies every MOG-APL mapping attempt into one of four queues. The queue assignment is accompanied by a substantiated, human-readable explanation of why the MOG was placed in that queue, verifiable by the CMP Team member reviewing it. There is no numeric confidence score; the queue assignment is the classification output.

GREEN QUEUE, Perfect Match

MOGs for which the business rules engine has determined a complete, unambiguous APL match. All validation checks have passed. The mapping is ready for direct, no-worry entry into CookBook by the CMP Team.
V1 behaviour: Presented to the CMP Team for manual entry into CookBook. The system has done all the thinking, the human simply actions it.
V2 behaviour: Auto-posted directly into CookBook via MCP API, removing the need for manual entry.
Dashboard impact: MOG moves from Unmapped to Mapped once CookBook entry is confirmed.

AMBER QUEUE, Likely Match, Confirmation Required

MOGs for which the business rules engine has identified a probable APL match but cannot fully validate it. The system presents its best candidate mapping with a substantiated explanation of its reasoning. A CMP Team member reviews and either confirms or corrects before CookBook entry.
V1 behaviour: Presented for HITL review. Upon confirmation, manually entered into CookBook by the CMP Team.
V2 behaviour: Post-confirmation, auto-posted into CookBook via MCP API.
Dashboard impact: MOG sits as Unmapped/Pending, Amber until resolved. Moves to Mapped upon confirmation and CookBook entry.

RED QUEUE, No Match Found, Investigation Required

MOGs for which the business rules engine cannot identify any credible APL match. These require active human investigation, either to locate the correct APL, correct a naming inconsistency, or identify that a MAM Exception 1 condition exists. The system explains why no match was found to guide the investigation.
V1 and V2 behaviour: Flagged for human investigation in both versions. No auto-execution is possible.
Dashboard impact: MOG sits as Unmapped/Pending, Red, separately visible from Amber on the dashboard.

BLUE QUEUE, APL Change Detected, Transition Planning Required

MOGs where an existing valid mapping in CookBook is affected by an APL becoming Inactive in the ODS. The Blue Queue is a forward-looking flag, not an error state. It communicates: an APL change has been detected in SAP that will eventually require a mapping update, but the existing mapping remains physically valid while the site's inventory of the retired APL lasts.
Why not Red? Because the existing MOG-APL mapping is still operationally correct. The site still has physical stock of the retired APL. Immediately breaking the mapping would disrupt recipe costing for an ingredient that is still actively being used on the ground. The Blue Queue preserves the mapping and alerts the human to plan the transition in advance.
Detection point: The ODS Active/Inactive flag on each APL record. When an APL that was Active in yesterday's ODS feed is Inactive in today's feed, the Autobot raises a Blue Queue flag for all MOGs mapped to that APL in CookBook.
V1 behaviour: Blue Queue items are presented to the CMP Team for transition planning. The existing CookBook mapping is preserved. The CMP Team decides when to action the transition based on ground-level stock visibility.
V2 behaviour: Once the CMP Team signals that physical stock is exhausted and the transition should be executed, the delink of the retired APL and the link of the replacement (if confirmed) are auto-executed as a single atomic transaction via MCP, ensuring the MOG is never left in an unmapped state during the switchover.
Dashboard impact: Blue Queue MOGs remain counted as Mapped (the existing mapping is intact). They are surfaced separately as a Blue Watch list, distinct from the Unmapped counts.

4.1 Queue Interaction with V2 APL Retirement Cases
Three specific scenarios arise in V2 when the ODS reports an APL retirement. The Autobot handles each as follows:

Case	ODS State	Existing CookBook State	Autobot Action	Queue
Case 1	APL1 Inactive. No replacement APL in ODS.	MOG1 → APL1 mapped	Preserve mapping. Flag MOG1 for transition planning. Explanation: APL1 retired, no replacement identified yet.	Blue
Case 2, Green	APL1 Inactive. APL2 arrives as replacement. Perfect match.	MOG1 → APL1 mapped	Preserve APL1 mapping. Present APL2 as confirmed replacement alongside Blue flag. CMP Team delinks APL1 and links APL2 as a single transition action.	Blue + Green
Case 2, Amber	APL1 Inactive. APL2 arrives as replacement. Likely but unconfirmed match.	MOG1 → APL1 mapped	Preserve APL1 mapping. Present APL2 as candidate alongside Blue flag. HITL confirmation required before transition.	Blue + Amber
Case 2, Red	APL1 Inactive. APL2 arrives but is not a credible replacement.	MOG1 → APL1 mapped	Preserve APL1 mapping. Flag Blue. APL2 not presented as replacement. Human investigation required.	Blue + Red
Case 3	APL1 Active. APL2 arrives as additional candidate. APL1 not retired.	MOG1 → APL1 mapped	Preserve APL1 mapping. Present APL2 as additive enrichment. If APL2 is lower cost, flag as candidate default.	Green or Amber (additive)

Case 2, Atomic transition rule (V2): The delink of APL1 and the link of APL2 must be executed as a single atomic transaction in CookBook. This ensures MOG1 is never left in an unmapped state, even for a fraction of the nightly processing cycle. If either operation fails, both must roll back.

Case 3, Additive enrichment rule: The Autobot must never replace an active APL mapping with a new APL. APL2 in Case 3 is additive, it supplements, not replaces, the existing APL1 mapping. If APL2 is lower cost than APL1, it is flagged as a candidate for new default, but the default change is a human decision.

5. Metrics, Measurement, and Mapping Progress Tracking
5.1 The Unit of Measurement, What is One Mapping?
A mapping is defined as a boolean state against a MOG:

State	Definition
Unmapped	The MOG has zero APLs linked to it in CookBook
Mapped	The MOG has at least one APL linked to it in CookBook

The number of APLs linked to a mapped MOG is irrelevant to the mapping count. Whether a MOG has one APL or five APLs linked, it counts as one mapped unit. The total mapping workload is always equal to the total number of MOGs in scope, clean, unambiguous, and independent of the 1:many APL complexity underneath.

5.2 The Progress Dashboard
The dashboard gives a real-time, at-a-glance view of the mapping exercise status against a user-defined Target Date. It strictly separates Original Workload from Incremental Workload that arrives mid-exercise.

Core Metrics
Metric	Description
Total MOGs, Original	Total MOGs in scope at the start of the exercise. This count is frozen once the exercise begins.
Total MOGs, Incremental	MOGs that entered scope after the exercise began. Tracked separately, never merged into the original count.
Mapped	MOGs with at least one APL linked in CookBook (Green confirmed + Amber confirmed).
Unmapped, Amber	MOGs awaiting HITL review and confirmation.
Unmapped, Red	MOGs with no match found, requiring active investigation.
Blue Watch	MOGs with an existing valid mapping where the linked APL has been retired in SAP. Counted as Mapped but flagged separately for transition planning.
% Complete (Original)	Mapped ÷ Total MOGs (Original) × 100
% Complete (Overall)	Mapped ÷ (Original + Incremental) × 100
Days to Target Date	Calendar days remaining to the user-defined target date.

The Incremental Workload Callout, Why It Must Be Separate
When new MOGs are added to scope mid-exercise, they must never be silently absorbed into the original count. If they were, the completion percentage would appear to regress even though no work has been undone, which is misleading and operationally confusing.
Instead the system keeps the original MOG count frozen as the baseline, tracks incremental additions as a separate named workload block, shows separate completion percentages for original vs. incremental vs. overall, and surfaces a callout flag when incremental load arrives, stating the volume and date it entered scope. The system does not plan for the human. It makes the situation visible and quantified. The CMP Team then decides on the ground how to address the additional load.

Illustrative Dashboard View
MOG-APL Mapping Progress
Target Date: [DD/MM/YYYY]          Days Remaining: [N]
ORIGINAL WORKLOAD
────────────────────────────────────────────
Total MOGs (Original)          100
  ├─ Mapped                     70        70%
  ├─ Unmapped, Amber           18        18%
  ├─ Unmapped, Red             12        12%
  └─ Blue Watch                  5         5%
INCREMENTAL WORKLOAD
⚠  50 new MOGs entered scope on [DD/MM/YYYY]
────────────────────────────────────────────
Total MOGs (Incremental)        50
  ├─ Mapped                      8        16%
  ├─ Unmapped, Amber           22        44%
  └─ Unmapped, Red             20        40%
OVERALL
────────────────────────────────────────────
Total MOGs                     150
Mapped                          78        52%
Total Pending                   72        48%
Blue Watch                       5         -
⚠  ATTENTION: 50 incremental MOGs added after target was set.
   Assess impact on Target Date and plan accordingly.


6. Functional Requirements
Must Have
1.FR-01: This Autobot must connect to the ODS and consume APL data changes on a nightly batch schedule, aligned with SAP's nightly extraction cycle into the ODS via RFC API. The ODS is the sole detection point for all APL state changes.
2.FR-02: The ODS must expose an Active/Inactive flag on each APL record. The Autobot reads this flag nightly to detect APL retirements. The mechanism for maintaining and exposing this flag is a Discovery phase deliverable.
3.FR-03: This Autobot must apply business rules to match incoming APL data against the MOG Master and route each MOG into one of four queues: Green, Amber, Red, or Blue.
4.FR-04: For every queue assignment, this Autobot must generate a substantiated, human-readable explanation of why the MOG was placed in that queue. This explanation must be verifiable by the reviewing CMP Team member.
5.FR-05: This Autobot must detect when an APL that was Active in the previous ODS feed is Inactive in the current feed and route all MOGs mapped to that APL in CookBook into the Blue Queue. The existing CookBook mapping must be preserved, not broken, at the point of Blue Queue assignment.
6.FR-06: When a retired APL (Blue Queue) and a credible replacement APL appear in the same or a subsequent nightly ODS feed, this Autobot must treat these as a linked transition event and present the replacement as a Green or Amber candidate alongside the Blue flag.
7.FR-07: When a new APL arrives for a MOG that already has an active valid mapping (Case 3, additive), this Autobot must preserve the existing mapping and present the new APL as an enrichment candidate. It must never replace an active mapping autonomously.
8.FR-08: This Autobot must handle the 1 MOG : Many APLs relationship, correctly maintaining default vs. non-default APL assignments per MOG per site. The default APL is the lowest-cost active APL at the site, subject to edge case overrides to be defined in Discovery.
9.FR-09: This Autobot must enforce the directional constraint that one APL maps to exactly one MOG. Multiple MOGs cannot be linked to the same APL.
10.FR-10: This Autobot must classify and surface MAM Exception 1 in both its forms: (a) MOG exists in CookBook with no matching APL in SAP/ODS, and (b) APL exists in ODS with no corresponding MOG in CookBook. It must never force-resolve these autonomously.
11.FR-11: This Autobot must include a pre-matching APL data quality check. Records missing product characteristic, pack size, or carrying other known anomaly patterns must be quarantined and flagged to relevant stakeholders, to be defined in Discovery, rather than used to create potentially incorrect mappings.
12.FR-12: This Autobot must define a mapping as a boolean state per MOG, Unmapped (zero APLs linked) or Mapped (at least one APL linked). The count of APLs linked does not affect the mapping status.
13.FR-13: This Autobot must maintain a real-time dashboard showing: Mapped, Amber-pending, Red-pending, and Blue Watch counts against a user-defined Target Date, with Original Workload and Incremental Workload tracked separately.
14.FR-14: This Autobot must surface a callout flag when incremental workload MOGs are detected mid-exercise, stating volume and date of entry, so the CMP Team can make an informed planning decision.
15.FR-15: This Autobot must maintain a full audit trail of all queue assignments, explanations, human confirmations/corrections, and CookBook entry timestamps, enabling complete traceability of every mapping decision.

Should Have
1.FR-16: This Autobot should show a daily completion rate trend on the dashboard so the CMP Team can assess whether current pace is sufficient to meet the Target Date.
2.FR-17: This Autobot should provide a breakdown of all dashboard metrics by site, so site-level mapping progress and backlog are visible independently.
3.FR-18: In V2, the delink of a retired APL and the link of its confirmed replacement must be executed as a single atomic transaction in CookBook via MCP, ensuring the MOG is never left in an unmapped state during the switchover.

Could Have
1.FR-19: This Autobot could send proactive alerts to relevant stakeholders when a high-frequency MOG's APL changes, given the downstream impact on recipe cost at scale.
2.FR-20: This Autobot could surface cost variance impact, flagging to the Food Cost team when a mapping update results in a significant cost change for a recipe.

Won't Have (this version)
•Modification of SAP APL records
•Modification of MOG culinary specifications in CookBook
•Direct procurement recommendations or supplier negotiations
•Consumer-facing or client-facing outputs
•Direct posting into CookBook (V1, manual by CMP Team; V2 roadmap item)

7. Non-Functional Requirements
7.1 Performance
•All mapping queue outputs from the nightly ODS refresh must be available for CMP Team review before the start of the next operational day.
•This Autobot must handle bulk APL updates without degradation.
•Dashboard must reflect real-time state, queue movements and CookBook confirmations must update immediately.

7.2 Security and Data Privacy
•All Autobot actions on CookBook (V2 via MCP) must be authenticated under a defined service identity.
•APL cost data is commercially sensitive, queue outputs, dashboard, and audit trail must be access-controlled.
•No APL cost data should be exposed outside of authorised internal systems or personnel.

7.3 Scalability
•This Autobot must scale to support ~400 sites, thousands of MOGs, and thousands of APLs without architectural changes.
•The progress dashboard must handle workload counts scaling beyond current volume without redesign.

7.4 Reliability and Auditability
•All queue assignments, explanations, human actions, and CookBook entries must be fully logged and auditable.
•V2 atomic transactions (delink + link) must be fully reversible, rollback must be available to authorised CMP Team members.
•This Autobot must handle ODS downtime gracefully, queuing pending operations and retrying without data loss or duplicate actions.

8. System Integrations

System	Role	Integration Method	Version
SAP	Source of APL data (Article Master, Active/Inactive status, cost)	RFC API → ODS (nightly batch)	V1 and V2
ODS (Operational Data Store)	Single source of truth for APL state. Exposes Active/Inactive flag per APL record. Autobot reads ODS, never SAP directly.	API / Data Feed	V1 and V2
CookBook	Target system, holds MOG Master and MOG-APL mapping. V1: CMP Team enters manually. V2: Autobot posts via MCP.	V1: Manual | V2: MCP API	V1 and V2
HITL Review Interface	Queue for Amber items awaiting CMP Team confirmation	CookBook UI or integrated interface	V1 and V2
Blue Watch Interface	Queue for APL retirement flags awaiting transition planning	CookBook UI or integrated interface	V1 and V2

V1 data flow: SAP  →  RFC API  →  ODS (nightly)  →  CMP Autobot  →  Queue outputs  →  CMP Team  →  CookBook (manual)
V2 data flow: SAP  →  RFC API  →  ODS (nightly)  →  CMP Autobot  →  MCP  →  CookBook (auto for Green / confirmed Amber / atomic transitions)




9. Data Requirements
9.1 APL Data (from ODS)
Each APL record must carry: Generic Product Name, Product Characteristic / Culinary Specification, Brand (or UB for Unbranded), Pack Size, Cost, Site applicability, Active / Inactive status, and Last Modified timestamp.

9.2 MOG Data (from CookBook)
Each MOG record must carry: MOG Name, MOG Type (Elementary / Composite), Generic Ingredient Category, Current linked APL(s), Default APL designation per site, and Mapped / Unmapped status.

9.3 Mapping State
This Autobot must maintain a persistent mapping state tracking: current MOG-APL links per site, historical links with timestamps, queue assignment history with explanations, human confirmation/correction records, Blue Watch list with retirement dates, and rollback history.

9.4 APL Data Quality, Design Consideration
Known APL data quality issues in SAP (missing characteristics, missing pack sizes, placeholder records) require a pre-matching quality check. Incomplete records are quarantined and surfaced to relevant stakeholders before mapping is attempted. A parallel APL correction workstream is underway in SAP, the Autobot does not wait for it to mature but must not compound the problem by mapping against bad data.

10. Open Questions
The following questions remain open for the Discovery phase. All other questions from previous drafts have been resolved and baked into the relevant sections of this PRD.

1.  Default APL, Edge Case Override Rules  [PARTIALLY RESOLVED]
Primary rule established: default = lowest-cost active APL at the site. Edge cases where culinary application demands a non-lowest-cost default (e.g., where presentation requirements or recipe-specific quality needs must override cost) need defined override rules. To be finalised in Discovery.

2.  ODS Active/Inactive Flag, Mechanism and Timing  [DEFERRED]
The ODS must expose an Active/Inactive flag per APL record for the Autobot to detect retirements. The exact mechanism for how SAP retirement events are captured, how quickly they are reflected in the ODS after the nightly feed, and how partial-night updates or lag scenarios are handled, all Discovery phase deliverables.

3.  Blue Queue, Transition Actioning Mechanism  [DEFERRED]
The Blue Queue preserves the existing mapping and flags it for transition planning. The system has no visibility into physical inventory levels, it cannot know when the site's stock of the retired APL is actually exhausted. A mechanism for the CMP Team or site team to signal 'stock exhausted, execute transition now' needs to be designed in Discovery. In V2, this signal would trigger the atomic delink + link transaction via MCP.

4.  Stakeholder Routing for APL Anomaly Alerts  [DEFERRED]
When this Autobot detects APL data quality anomalies, it must surface them to relevant stakeholders. The definition of who those stakeholders are, by anomaly type and by site, is a Discovery phase deliverable.

5.  MAM Exception SLA  [DEFERRED]
Expected resolution turnaround for a MAM Exception once raised, and accountability for resolution at site level, to be defined in a future phase.

6.  RTE / RTU Classification  [DEFERRED]
Not in scope for this version. To be revisited in a future phase if relevant.
11. Appendix
11.1 Key Terminology
Term	Definition
MOG	Managed Order Guide. A Culinary Specification of a Generic Ingredient.
APL	Approved Product List. The Procurement Specification of an MOG. Carries: Generic Name, Characteristic, Brand (or UB), Pack Size, and Cost.
MAM	MOG-APL Mapping. The act of linking an MOG in CookBook to its corresponding APL(s).
MAM Exception 1	Dissonance between Culinary (MOG) and Procurement (APL) reality at a site. Type A: MOG exists, no APL. Type B: APL exists, no MOG.
Elementary MOG	A single, specific form of a generic ingredient used directly in cooking. E.g., Iodized Salt, Cashew Whole, Cashew Broken.
Composite MOG	A blend of two or more ingredients, market-procured as a packed product, used directly in cooking. Inhouse-prepared versions do not qualify.
Green Queue	Perfect match, all business rules validated. Ready for CookBook entry (V1: manual, V2: auto via MCP).
Amber Queue	Likely match, HITL confirmation required before CookBook entry.
Red Queue	No match found, active human investigation required.
Blue Queue	APL retirement detected in ODS, existing mapping valid, transition planning required. Not an error state.
Mapped/ Unmapped	Boolean: MOG has/does not have at least one APL linked in CookBook.
ODS	Operational Data Store. Receives APL data from SAP nightly via RFC API. The Autobot's sole detection point for APL state changes.
MCP	Model Context Protocol. V2 interface for Autobot to post directly into CookBook.
RFC API	Remote Function Call API. Mechanism for SAP → ODS nightly data transfer.
UB	Unbranded. Used in the Brand field of an APL for unbranded/loose products.
HITL	Human-in-the-Loop. CMP Team review of Amber Queue items before CookBook entry.
Atomic Transaction	V2: Delink of retired APL and link of replacement executed as a single indivisible operation. If either fails, both roll back.
Food Cost	Cost of raw materials consumed to produce a dish or meal. Central financial and operational metric for Compass Group India.
11.2 MOG-APL Relationship Rules Summary
•1 MOG can link to 1 or more APLs ✓
•1 APL maps to exactly 1 MOG, never more ✓
•Multiple MOGs cannot map to the same APL ✗
•Default APL = lowest-cost active APL at the site (subject to Discovery-defined overrides)
•Default is site-specific, same MOG can have different defaults at different sites
•Mapping is boolean per MOG, Unmapped (zero APLs) or Mapped (one or more APLs)
11.3 System Architecture, High-Level Flow

SAP (Article Master / Active-Inactive / Cost)
                  ↓
              RFC API
                  ↓
        ODS, nightly batch feed
      [APL records + Active/Inactive flag]
                  ↓
       CMP Autobot, MOG-APL Mapper
         ↓ reads MOG Master (CookBook)
         ↓ applies business rules
         ↓ generates queue outputs + explanations
         ↓
  ┌──────┬──────┬──────┬──────┐
  Green  Amber   Red   Blue
  │      │       │      └─ Transition watch
  │      │       └──────── Investigation required
  │      └──────────────── HITL confirmation
  └─────────────────────── Ready for CookBook entry
                  ↓
           CMP Team Action
    V1: Manual CookBook entry
    V2: Auto-post via MCP API
                  ↓
     CookBook MOG-APL Mappings
                  ↓
       Recipe Costing Engine
                  ↓
      Accurate Food Cost Output