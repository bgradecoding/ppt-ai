'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { uploadPresentationTemplate } from '@/app/_actions/presentation/templateActions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
// Assuming a simple Textarea or you might have one in ui/textarea
// For now, using a standard HTML textarea. If you have a ui/textarea, import and use that.

export default function UploadTemplateForm() {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    if (!file) {
      setMessage('Please select a .pptx file to upload.');
      setIsError(true);
      setIsLoading(false);
      return;
    }
    if (!name.trim()) {
      setMessage('Please enter a template name.');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    if (description.trim()) {
      formData.append('description', description.trim());
    }
    formData.append('file', file);

    try {
      const result = await uploadPresentationTemplate(formData);
      if (result.success && result.template) {
        setMessage(`Template "${result.template.name}" uploaded successfully! ID: ${result.template.id}`);
        setIsError(false);
        // Reset form
        setName('');
        setDescription('');
        setFile(null);
        const fileInput = document.getElementById('templateFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage(result.error || 'An unknown error occurred.');
        setIsError(true);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage(error instanceof Error ? error.message : 'An unexpected error occurred during upload.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-4 border rounded-lg shadow-md">
      <div>
        <Label htmlFor="templateName" className="block text-sm font-medium text-gray-700">
          Template Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="templateName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Q1 Business Review"
          required
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <Label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700">
          Description (Optional)
        </Label>
        <textarea
          id="templateDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A brief description of the template"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
      </div>

      <div>
        <Label htmlFor="templateFile" className="block text-sm font-medium text-gray-700">
          Template File (.pptx) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="templateFile"
          type="file"
          onChange={handleFileChange}
          accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          required
          className="mt-1 block w-full"
        />
        {file && <p className="text-xs text-gray-500 mt-1">Selected: {file.name}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Uploading...' : 'Upload Template'}
      </Button>

      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </form>
  );
}
