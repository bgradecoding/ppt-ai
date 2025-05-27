// Using "type" for PptxGenJS.SlideMasterProps if we're only defining configuration objects.
// If PptxGenJS itself is needed for more complex logic here, a full import would be used.
import type { PresSlideMasterProps } from 'pptxgenjs';

// Define TITLE_MASTER
const TITLE_MASTER: PresSlideMasterProps = {
  title: 'TITLE_MASTER',
  background: { color: 'F1F1F1' }, // Light gray background
  objects: [
    {
      text: {
        options: {
          x: 0.5,
          y: 1.5,
          w: '90%',
          h: 1,
          placeholder: 'titlePlaceholder', // Key for adding text to this specific shape
          align: 'center',
          fontSize: 36,
          color: '333333', // Dark gray text
        },
      },
    },
    {
      text: {
        options: {
          x: 0.5,
          y: 3.0,
          w: '90%',
          h: 1,
          placeholder: 'subtitlePlaceholder', // Key for adding text to this specific shape
          align: 'center',
          fontSize: 24,
          color: '555555', // Medium gray text
        },
      },
    },
  ],
};

// Define CONTENT_MASTER
const CONTENT_MASTER: PresSlideMasterProps = {
  title: 'CONTENT_MASTER',
  background: { color: 'F1F1F1' }, // Consistent light gray background
  objects: [
    {
      text: {
        options: {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 1,
          placeholder: 'headerPlaceholder', // Key for adding text to this specific shape
          align: 'center',
          fontSize: 32,
          color: '333333',
        },
      },
    },
    {
      text: {
        options: {
          x: 0.5,
          y: 1.7,
          w: '90%',
          h: 4, // Enough height for a body of text
          placeholder: 'bodyPlaceholder', // Key for adding text to this specific shape
          fontSize: 18,
          color: '444444',
          align: 'left', // Typically body text is left-aligned
          valign: 'top',
        },
      },
    },
    // Example of an image placeholder (optional, can be added if needed)
    // {
    //   image: {
    //     x: 1, y: 1, w: 8, h: 4,
    //     placeholder: "imagePlaceholder", // Key for adding an image to this specific shape
    //   }
    // }
  ],
};

export const masterDefinitions = {
  TITLE_MASTER,
  CONTENT_MASTER,
};

// Optional: For type safety when using master names
export type MasterDefinitionName = keyof typeof masterDefinitions;
