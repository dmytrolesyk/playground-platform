declare module 'cytoscape-fcose' {
  import type cytoscape from 'cytoscape';
  const fcose: cytoscape.Ext;
  export default fcose;
}

// Expose Cytoscape instance for E2E testing
interface Window {
  __cyGraph?: import('cytoscape').Core | undefined;
}
