import React from 'react';
import {
  Heart,
  Bone,
  Stethoscope,
  Brain,
  Eye,
  Ear,
  Baby,
  Activity,
  Scissors,
  Smile,
  Syringe,
  Scan,
  ShieldAlert,
  Sparkles,
  Users,
  Pill,
} from 'lucide-react';

interface SpecialistIconProps {
  department: string;
  size?: number;
  className?: string;
}

export default function SpecialistIcon({ department = '', size = 16, className = '' }: SpecialistIconProps) {
  const deptLower = (department || '').toLowerCase();

  if (deptLower.includes('jantung') || deptLower.includes('kardio')) {
    return <Heart size={size} className={className} />;
  }
  if (deptLower.includes('ortopedi') || deptLower.includes('tulang')) {
    return <Bone size={size} className={className} />;
  }
  if (deptLower.includes('paru') || deptLower.includes('pulmonologi')) {
    return <Activity size={size} className={className} />;
  }
  if (deptLower.includes('saraf') || deptLower.includes('neurologi')) {
    return <Brain size={size} className={className} />;
  }
  if (deptLower.includes('gigi') || deptLower.includes('mulut') || deptLower.includes('dental')) {
    return <Smile size={size} className={className} />;
  }
  if (deptLower.includes('mata') || deptLower.includes('oftalmologi')) {
    return <Eye size={size} className={className} />;
  }
  if (deptLower.includes('tht') || deptLower.includes('telinga')) {
    return <Ear size={size} className={className} />;
  }
  if (deptLower.includes('anak') || deptLower.includes('pediatri')) {
    return <Baby size={size} className={className} />;
  }
  if (deptLower.includes('kandungan') || deptLower.includes('kebidanan') || deptLower.includes('obgyn')) {
    return <Users size={size} className={className} />;
  }
  if (deptLower.includes('bedah')) {
    return <Scissors size={size} className={className} />;
  }
  if (deptLower.includes('kulit') || deptLower.includes('kelamin') || deptLower.includes('dermatologi')) {
    return <Sparkles size={size} className={className} />;
  }
  if (deptLower.includes('anestesi')) {
    return <Syringe size={size} className={className} />;
  }
  if (deptLower.includes('radiologi') || deptLower.includes('rontgen')) {
    return <Scan size={size} className={className} />;
  }
  if (deptLower.includes('jiwa') || deptLower.includes('psikiatri')) {
    return <Brain size={size} className={className} />;
  }
  if (deptLower.includes('rehab') || deptLower.includes('fisioterapi')) {
    return <Activity size={size} className={className} />;
  }
  if (deptLower.includes('farmasi') || deptLower.includes('obat')) {
    return <Pill size={size} className={className} />;
  }

  return <Stethoscope size={size} className={className} />;
}
