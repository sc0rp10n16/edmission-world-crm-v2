export type ApplicationStatus = 
  | 'draft'
  | 'documents_pending'
  | 'under_review'
  | 'additional_docs_required'
  | 'completed';

export interface Application {
  id: string;
  studentId: string;
  counselorId: string;
  status: ApplicationStatus;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}