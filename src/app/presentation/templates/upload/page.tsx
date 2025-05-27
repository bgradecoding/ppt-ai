import UploadTemplateForm from '@/components/presentation/template/UploadTemplateForm';

export default function UploadPresentationTemplatePage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Upload New Presentation Template
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Add a new .pptx template to be used for generating presentations.
        </p>
      </header>
      
      <main>
        <UploadTemplateForm />
      </main>
    </div>
  );
}
