import React, { useState } from 'react';
import { ChevronRight, X, Info } from 'lucide-react';
import { queueTheme } from '../styles/queueTheme';
const images = [
{
  id: 'front',
  label: 'Front',
  url: 'https://static.openfoodfacts.org/images/products/890/208/010/4048/1.jpg'
},
{
  id: 'back',
  label: 'Back Label',
  url: 'https://static.openfoodfacts.org/images/products/890/208/010/4048/2.jpg'
},
{
  id: 'barcode',
  label: 'Barcode',
  url: 'https://static.openfoodfacts.org/images/products/890/208/010/4048/3.jpg'
}];

type LabelPanelProps = {
  onClose?: () => void;
};

export function LabelPanel({ onClose }: LabelPanelProps) {
  const [selected, setSelected] = useState('back');
  const [isOpen, setIsOpen] = useState(true);
  const activeImage = images.find((img) => img.id === selected) ?? images[1];

  return (
    <div
      className={`${queueTheme.rightPanel} flex flex-col h-full transition-all duration-200 ${
        isOpen
          ? 'w-[clamp(280px,30vw,360px)] min-w-[280px] max-w-[360px] overflow-y-auto'
          : 'w-10 min-w-10'
      }`}
    >
      {/* Header */}
      <div className={`border-b border-border ${isOpen ? 'px-4 py-2' : 'px-1.5 py-2.5'}`}>
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen ? (
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">Label Images</h3>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          ) : null}
          <div className={`flex items-center ${isOpen ? 'gap-0.5' : ''}`}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={isOpen ? 'Collapse label images panel' : 'Expand label images panel'}
              title={isOpen ? 'Collapse panel' : 'Expand panel'}
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
            </button>
            {isOpen && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close label images panel"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {isOpen ? (
        <>
          {/* Product Image */}
          <div className="flex-1 flex items-start justify-center p-4">
            <div className="rounded-lg overflow-hidden border border-border bg-muted/30 shadow-soft w-full">
              <img
                src={activeImage.url}
                alt={activeImage.label}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Image Selector Thumbnails */}
          <div className="px-4 pb-4">
            <div className="flex gap-3 justify-center">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelected(img.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`w-[90px] h-[70px] rounded-md overflow-hidden flex items-center justify-center transition-all ${
                      selected === img.id
                        ? 'border-2 border-primary shadow-sm'
                        : 'border border-border hover:border-muted-foreground/40'
                    } ${img.id === 'barcode' ? 'bg-background' : 'bg-muted/30'}`}
                  >
                    {img.id === 'barcode' ? (
                      <div className="flex gap-[1px]">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-10 bg-black"
                            style={{
                              width: i % 3 === 0 ? '2px' : '1px'
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      selected === img.id
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    {img.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}