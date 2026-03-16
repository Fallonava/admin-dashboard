import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStaffPerformance {
  name: string;
  total: number;
}

export interface IAuditLog {
  action: string;
  timestamp: Date;
  by: string;
  note: string;
}

export interface IMissingSepDetail {
  no_rm: string;
  nama: string;
  asuransi: string;
  poli?: string;
  anomaly_reason?: string | null;
  status: 'OPEN' | 'RESOLVED' | 'PENDING_DOCTOR' | 'PENDING_SYSTEM' | 'REJECTED' | 'IGNORED';
  audit_logs: IAuditLog[];
  resolvedAt?: Date;
}

export interface IDailyRecap extends Document {
  date: Date;
  total_patients: number;
  missing_sep_count: number;
  staff_performance: IStaffPerformance[];
  missing_sep_details: IMissingSepDetail[];
  createdAt: Date;
  updatedAt: Date;
}

const StaffPerformanceSchema = new Schema<IStaffPerformance>({
  name: { type: String, required: true },
  total: { type: Number, required: true },
});

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  by: { type: String, required: true },
  note: { type: String, required: true },
});

const MissingSepDetailSchema = new Schema<IMissingSepDetail>({
  no_rm: { type: String, required: true },
  nama: { type: String, required: true },
  asuransi: { type: String, required: true },
  poli: { type: String, default: '-' },
  anomaly_reason: { type: String, default: null },
  status: { type: String, enum: ['OPEN', 'RESOLVED', 'PENDING_DOCTOR', 'PENDING_SYSTEM', 'REJECTED', 'IGNORED'], default: 'OPEN' },
  audit_logs: { type: [AuditLogSchema], default: [] },
  resolvedAt: { type: Date },
});

const DailyRecapSchema = new Schema<IDailyRecap>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    total_patients: {
      type: Number,
      required: true,
      default: 0,
    },
    missing_sep_count: {
      type: Number,
      required: true,
      default: 0,
    },
    staff_performance: {
      type: [StaffPerformanceSchema],
      default: [],
    },
    missing_sep_details: {
      type: [MissingSepDetailSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent OverwriteModelError during hot reloading
const DailyRecap: Model<IDailyRecap> = mongoose.models.DailyRecap || mongoose.model<IDailyRecap>('DailyRecap', DailyRecapSchema);

export default DailyRecap;
