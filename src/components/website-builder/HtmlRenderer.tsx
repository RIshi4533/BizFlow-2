
'use client';

import * as React from 'react';

// A sandboxed iframe is the safest way to render arbitrary HTML.
// It prevents the rendered content from executing scripts or accessing parent window resources.
export const HtmlRenderer = ({ htmlContent, ...props }: { htmlContent: string, [key: string]: any }) => {
  return (
    <iframe
      {...props}
      srcDoc={htmlContent}
      // The sandbox attribute adds a layer of security.
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      className="w-full h-full border-0"
      title="html-preview"
    />
  );
};
