'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Assuming this exists, if not, use HTML textarea
import type { PresSlideMasterProps } from 'pptxgenjs'; // For typing availableMasters

interface SlideInputFormProps {
  slideId: string;
  availableMasters: Record<string, PresSlideMasterProps>;
  selectedMasterName: string;
  slideData: Record<string, string>;
  onMasterChange: (slideId: string, newMasterName: string) => void;
  onDataChange: (slideId: string, placeholderName: string, value: string) => void;
  onRemoveSlide: (slideId: string) => void;
}

export default function SlideInputForm({
  slideId,
  availableMasters,
  selectedMasterName,
  slideData,
  onMasterChange,
  onDataChange,
  onRemoveSlide,
}: SlideInputFormProps) {
  const currentMasterDefinition = availableMasters[selectedMasterName];

  const getPlaceholders = (): string[] => {
    if (!currentMasterDefinition || !currentMasterDefinition.objects) return [];
    const placeholders: string[] = [];
    currentMasterDefinition.objects.forEach(obj => {
      if (obj.text && obj.text.options && obj.text.options.placeholder) {
        placeholders.push(obj.text.options.placeholder);
      } else if (obj.image && obj.image.placeholder) {
        // For simplicity, image placeholders will also get a text input for URL/data URI
        placeholders.push(obj.image.placeholder);
      }
      // Add other placeholder types if necessary (e.g., shape placeholders)
    });
    return [...new Set(placeholders)]; // Ensure unique placeholder names
  };

  const placeholders = getPlaceholders();

  return (
    <div className="p-4 border rounded-lg space-y-4 bg-slate-50 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Slide ID: {slideId.substring(0, 8)}...</h3>
        <Button variant="outline" size="sm" onClick={() => onRemoveSlide(slideId)}>
          Remove Slide
        </Button>
      </div>

      <div>
        <Label htmlFor={`master-${slideId}`}>Slide Master</Label>
        <Select
          value={selectedMasterName}
          onValueChange={(newMaster) => onMasterChange(slideId, newMaster)}
        >
          <SelectTrigger id={`master-${slideId}`}>
            <SelectValue placeholder="Select a master" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(availableMasters).map((masterKey) => (
              <SelectItem key={masterKey} value={masterKey}>
                {availableMasters[masterKey]?.title || masterKey}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {placeholders.map((placeholder) => {
        // Determine if a placeholder might be for multi-line input (e.g., 'bodyPlaceholder')
        const isBodyPlaceholder = placeholder.toLowerCase().includes('body') || placeholder.toLowerCase().includes('content');
        return (
          <div key={placeholder}>
            <Label htmlFor={`${slideId}-${placeholder}`} className="capitalize">
              {placeholder.replace(/Placeholder$/, '').replace(/([A-Z])/g, ' $1').trim()}
            </Label>
            {isBodyPlaceholder ? (
              <Textarea
                id={`${slideId}-${placeholder}`}
                value={slideData[placeholder] || ''}
                onChange={(e) => onDataChange(slideId, placeholder, e.target.value)}
                placeholder={`Enter data for ${placeholder}`}
                className="mt-1 block w-full"
                rows={3}
              />
            ) : (
              <Input
                id={`${slideId}-${placeholder}`}
                type="text"
                value={slideData[placeholder] || ''}
                onChange={(e) => onDataChange(slideId, placeholder, e.target.value)}
                placeholder={`Enter data for ${placeholder}`}
                className="mt-1 block w-full"
              />
            )}
            {placeholder.toLowerCase().includes('image') && (
                 <p className="text-xs text-gray-500 mt-1">For image placeholders, provide a URL or data URI.</p>
            )}
          </div>
        );
      })}
      {!placeholders.length && currentMasterDefinition && (
        <p className="text-sm text-gray-500">This master has no defined placeholders for direct text/image input via this form.</p>
      )}
       {!currentMasterDefinition && (
        <p className="text-sm text-red-500">Error: Master definition not found for "{selectedMasterName}".</p>
      )}
    </div>
  );
}
