import { PDFDocument } from 'pdf-lib';

/**
 * Convert an image (JPG/PNG) to a single-page PDF sized to the image dimensions.
 * Returns the PDF as Uint8Array.
 */
export async function convertImageToPdf(
	imageBytes: ArrayBuffer,
	mimeType: string
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();

	let image;
	if (mimeType === 'image/png') {
		image = await pdfDoc.embedPng(imageBytes);
	} else {
		// jpg/jpeg
		image = await pdfDoc.embedJpg(imageBytes);
	}

	const { width, height } = image.scale(1);
	const page = pdfDoc.addPage([width, height]);
	page.drawImage(image, {
		x: 0,
		y: 0,
		width,
		height
	});

	return await pdfDoc.save();
}

/**
 * Check if a MIME type is a convertible image type.
 */
export function isConvertibleImage(mimeType: string): boolean {
	return ['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType.toLowerCase());
}
