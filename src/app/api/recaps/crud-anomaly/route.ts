import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import DailyRecap from '@/models/DailyRecap';

// CREATE (Manual Addition)
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { date, no_rm, nama, asuransi, user } = payload;
    
    if (!date || !no_rm || !nama || !asuransi || !user) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the recap for that date or create one if it doesn't exist
    // If creating a brand new recap just for a manual anomaly, set patients to 0 initially
    let recap = await DailyRecap.findOne({ date });
    
    if (!recap) {
      recap = new DailyRecap({
        date: new Date(date),
        total_patients: 0,
        missing_sep_count: 0,
        staff_performance: [],
        missing_sep_details: []
      });
    }

    // Check if anomaly already exists for this RM on this date
    if (recap.missing_sep_details.some((d: any) => d.no_rm === no_rm)) {
        return NextResponse.json({ success: false, error: 'Patient RM already exists in anomalies for this date' }, { status: 400 });
    }

    // Append the new anomaly
    const newAnomaly = {
        no_rm,
        nama,
        asuransi,
        status: 'OPEN' as 'OPEN' | 'RESOLVED' | 'PENDING_DOCTOR' | 'PENDING_SYSTEM' | 'REJECTED' | 'IGNORED',
        audit_logs: [{
            action: 'Manually Added',
            note: 'Added manually via dashboard',
            by: user,
            timestamp: new Date()
        }]
    };

    recap.missing_sep_details.push(newAnomaly);
    recap.missing_sep_count += 1; // Update count

    await recap.save();

    return NextResponse.json({ success: true, data: recap });
  } catch (error: any) {
    console.error('Error creating anomaly:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// UPDATE (Edit details)
export async function PUT(request: Request) {
    try {
      const payload = await request.json();
      const { recap_id, original_no_rm, no_rm, nama, asuransi, user } = payload;
      
      if (!recap_id || !original_no_rm || !no_rm || !nama || !asuransi || !user) {
        return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
      }
  
      await connectToDatabase();
  
      const recap = await DailyRecap.findById(recap_id);
      if (!recap) {
          return NextResponse.json({ success: false, error: 'Recap not found' }, { status: 404 });
      }
  
      // Find the specific missing SEP detail
      const detailIndex = recap.missing_sep_details.findIndex((d: any) => d.no_rm === original_no_rm);
      if (detailIndex === -1) {
          return NextResponse.json({ success: false, error: 'Patient anomaly not found' }, { status: 404 });
      }
  
      const currentDetail = recap.missing_sep_details[detailIndex];
      
      let changes = [];
      if (currentDetail.no_rm !== no_rm) changes.push(`RM: ${currentDetail.no_rm} -> ${no_rm}`);
      if (currentDetail.nama !== nama) changes.push(`Nama: ${currentDetail.nama} -> ${nama}`);
      if (currentDetail.asuransi !== asuransi) changes.push(`Asuransi: ${currentDetail.asuransi} -> ${asuransi}`);

      if (changes.length > 0) {
          currentDetail.no_rm = no_rm;
          currentDetail.nama = nama;
          currentDetail.asuransi = asuransi;

          // Push audit log
          currentDetail.audit_logs.push({
              action: 'Edited Details',
              note: changes.join(', '),
              by: user,
              timestamp: new Date()
          });
          
          await recap.save();
      }
  
      return NextResponse.json({ success: true, data: recap });
    } catch (error: any) {
      console.error('Error editing anomaly:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE 
export async function DELETE(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const recap_id = searchParams.get('recap_id');
      const no_rm = searchParams.get('no_rm');
      
      if (!recap_id || !no_rm) {
        return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
      }
  
      await connectToDatabase();
  
      const recap = await DailyRecap.findById(recap_id);
      if (!recap) {
          return NextResponse.json({ success: false, error: 'Recap not found' }, { status: 404 });
      }
  
      // Find the specific missing SEP detail
      const detailIndex = recap.missing_sep_details.findIndex((d: any) => d.no_rm === no_rm);
      if (detailIndex === -1) {
          return NextResponse.json({ success: false, error: 'Patient anomaly not found' }, { status: 404 });
      }
  
      recap.missing_sep_details.splice(detailIndex, 1);
      
      // Update count
      if (recap.missing_sep_count > 0) {
          recap.missing_sep_count -= 1;
      }
  
      await recap.save();
  
      return NextResponse.json({ success: true, data: recap });
    } catch (error: any) {
      console.error('Error deleting anomaly:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
