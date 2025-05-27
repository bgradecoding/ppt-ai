import PresentationGenerationForm from '@/components/presentation/generation/PresentationGenerationForm';

export default function GenerateNewPresentationPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Generate New Presentation
        </h1>
        <p className="mt-3 text-xl text-gray-600">
          Dynamically build your presentation by adding slides and choosing master templates.
        </p>
      </header>
      
      <main>
        <PresentationGenerationForm />
      </main>
    </div>
  );
}
