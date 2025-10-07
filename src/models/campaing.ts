import { Store } from "@/services/store.service";
export interface TargetAudience {
  ageRange: AgeRange;
  gender: string;
  location: string;
  interests: string[];
}
export type CampaingStatus =  | 'completed' | 'draft' | 'progress' | 'cancelled' | 'scheduled' | 'active';

export interface AgeRange {
  min: number;
  max: number;
}

export interface Campaing {
  targetAudience: TargetAudience;
  _id: string;
  title: string;
  type: string;
  store: any;
  description: string;
  content: string;
  image: string;
  startDate: Date;
  endDate: Date;
  status: CampaingStatus;
  audience: number;
  sent: number;
  notSent: number;
  errors: number;
  cost: number;
  deliveryRate: number;
  generalRate: number;
  createdBy: string;
  createdAt: Date;
  __v: number;
  updatedAt: Date;
  campaignType: string;
  platform?: string;
  sourceTn?: string;
}
