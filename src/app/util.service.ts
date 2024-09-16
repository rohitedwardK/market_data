import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  istDateTime: string;

  constructor() { 

  }

  public parseDateToIST(gmtDateTime: string) {
    // Create a Date object from the GMT datetime string
    const date = new Date(gmtDateTime);
  
    // Extract date components
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // Months are 0-based
    const day = date.getUTCDate();
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
  
    // Format the date and time
    const formattedDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
    
    return {
      date: formattedDate,
      time: this.convertTimeToIST(formattedTime)
    };
  }

  public convertTimeToIST(gmtTime: string) {
    // Parse the GMT time
    const [hours, minutes, seconds] = gmtTime.split(':').map(Number);
    
    // IST is GMT + 5 hours 30 minutes
    let istHours = hours + 5;
    let istMinutes = minutes + 30;
    
    // Adjust for minutes overflow
    if (istMinutes >= 60) {
      istMinutes -= 60;
      istHours += 1;
    }
  
    // Adjust for hours overflow
    if (istHours >= 24) {
      istHours -= 24;
    }
  
    // Convert to 12-hour format
    const period = istHours >= 12 ? 'PM' : 'AM';
    const displayHours = istHours % 12 || 12; // Convert 0 hour to 12 for 12-hour format
    const formattedTime = `${String(displayHours).padStart(2, '0')}:${String(istMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
  
    return formattedTime;
  }
}
