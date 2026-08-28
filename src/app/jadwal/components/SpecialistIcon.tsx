import React from 'react';
import { Heart, Bone, Stethoscope, Brain, User, PlusCircle, Eye, Ear, Baby, Activity, Scissors } from 'lucide-react';

interface SpecialistIconProps {
    department: string;
    size?: number;
    className?: string;
}

export default function SpecialistIcon({ department, size = 24, className = '' }: SpecialistIconProps) {
    const deptLower = department.toLowerCase();

    if (deptLower.includes('jantung')) return <Heart size={size} className={className} />;
    if (deptLower.includes('ortopedi')) return <Bone size={size} className={className} />;
    if (deptLower.includes('paru')) return <Activity size={size} className={className} />;
    if (deptLower.includes('saraf')) return <Brain size={size} className={className} />;
    if (deptLower.includes('gigi')) return <PlusCircle size={size} className={className} />;
    if (deptLower.includes('dalam')) return <Stethoscope size={size} className={className} />;
    if (deptLower.includes('mata')) return <Eye size={size} className={className} />;
    if (deptLower.includes('tht')) return <Ear size={size} className={className} />;
    if (deptLower.includes('anak')) return <Baby size={size} className={className} />;
    if (deptLower.includes('kandungan') || deptLower.includes('kebidanan')) return <User size={size} className={className} />;
    if (deptLower.includes('bedah')) return <Scissors size={size} className={className} />;

    return <Stethoscope size={size} className={className} />;
}
