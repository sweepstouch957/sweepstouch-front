/**
 * Herramientas de imagen para el catálogo de la tienda (tab Productos):
 *  - PasteReplaceDialog: confirmar el reemplazo de la imagen de una fila con lo pegado (Ctrl+V).
 *  - ProductEditorDialog: alta/edición de un producto con imagen pegada, subida, recortada
 *    del circular o generada con IA, y quitar fondo.
 *  - FlyerCropper: recorte sobre el circular (lo usa también Shelfsigns).
 */
export type { PctBox } from './constants';
export { FlyerCropper } from './flyer-cropper';
export { PasteReplaceDialog } from './paste-replace-dialog';
export { ProductEditorDialog } from './product-editor-dialog';
export { imageFromPaste, isTypingTarget } from './utils';
