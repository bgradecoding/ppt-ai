'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { masterDefinitions, MasterDefinitionName } from '@/lib/presentation/pptxgenjsMasters';
import { generatePresentationFromTemplate } from '@/app/_actions/presentation/presentationActions';
import SlideInputForm from './SlideInputForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface SlideState {
  id: string;
  masterName: MasterDefinitionName; // Use the exported type for safety
  data: Record<string, string>;
}

export default function PresentationGenerationForm() {
  const [presentationTitle, setPresentationTitle] = useState<string>('My New Presentation');
  const [slides, setSlides] = useState<SlideState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultMasterName = Object.keys(masterDefinitions)[0] as MasterDefinitionName || 'TITLE_MASTER';

  const handleAddSlide = () => {
    const newSlide: SlideState = {
      id: uuidv4(),
      masterName: defaultMasterName, 
      data: {},
    };
    setSlides([...slides, newSlide]);
  };

  const handleRemoveSlide = (slideId: string) => {
    setSlides(slides.filter(slide => slide.id !== slideId));
  };

  const handleSlideMasterChange = (slideId: string, newMasterName: string) => {
    setSlides(slides.map(slide => 
      slide.id === slideId ? { ...slide, masterName: newMasterName as MasterDefinitionName, data: {} } : slide // Reset data on master change
    ));
  };

  const handleSlideDataChange = (slideId: string, placeholderName: string, value: string) => {
    setSlides(slides.map(slide =>
      slide.id === slideId ? { ...slide, data: { ...slide.data, [placeholderName]: value } } : slide
    ));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!presentationTitle.trim()) {
      setError("Presentation title is required.");
      setIsLoading(false);
      return;
    }
    if (slides.length === 0) {
      setError("Please add at least one slide.");
      setIsLoading(false);
      return;
    }

    const slidesDataForAction = slides.map(slide => ({
      masterName: slide.masterName,
      data: slide.data,
    }));

    // Placeholder for userId. In a real app, this would come from auth.
    const userId = "user-123-placeholder"; 

    try {
      const result = await generatePresentationFromTemplate({
        newPresentationTitle: presentationTitle,
        slidesData: slidesDataForAction,
        userId: userId, 
        // masterSetName: "CustomMasterSet" // Optional: if you want to group these masters
        // templateUploadId: "some-template-id" // Optional: if this generation is based on an uploaded template
      });

      if (result.success) {
        setSuccessMessage(`Presentation generated! ID: ${result.presentationId}, Path: ${result.filePath}`);
        // Optionally reset form:
        // setPresentationTitle('My New Presentation');
        // setSlides([]);
      } else {
        setError(result.error || 'Failed to generate presentation.');
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-4 md:p-6">
      <div>
        <Label htmlFor="presentationTitle" className="text-lg font-medium">Presentation Title</Label>
        <Input
          id="presentationTitle"
          type="text"
          value={presentationTitle}
          onChange={(e) => setPresentationTitle(e.target.value)}
          placeholder="Enter presentation title"
          className="mt-2"
        />
      </div>

      <Button onClick={handleAddSlide} variant="outline">Add Slide</Button>

      {slides.map((slide, index) => (
        <SlideInputForm
          key={slide.id}
          slideId={slide.id}
          availableMasters={masterDefinitions}
          selectedMasterName={slide.masterName}
          slideData={slide.data}
          onMasterChange={handleSlideMasterChange}
          onDataChange={handleSlideDataChange}
          onRemoveSlide={handleRemoveSlide}
        />
      ))}

      <Button onClick={handleSubmit} disabled={isLoading || slides.length === 0} size="lg" className="w-full">
        {isLoading ? 'Generating...' : 'Generate Presentation'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert variant="default" className="bg-green-100 border-green-400 text-green-700">
           <Terminal className="h-4 w-4" /> {/* You might want a different icon for success */}
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
