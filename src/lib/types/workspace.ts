/** A single individual workspace image in the gallery. */
export interface IndividualWorkspaceImage {
	id: string;
	participantName: string;
	imageData: string;
	featureNames: string[];
	prompt: string;
	createdAt: string;
}

/** A single collective workspace image in the gallery. */
export interface CollectiveWorkspaceImage {
	id: string;
	imageData: string;
	prompt: string;
	featureNames: string[];
	createdAt: string;
}

/** Response shape from /api/workspace-images. */
export interface WorkspaceImagesResponse {
	individual: IndividualWorkspaceImage[];
	collective: CollectiveWorkspaceImage[];
}
