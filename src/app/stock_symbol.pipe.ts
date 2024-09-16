import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeNs'
})
export class RemoveNsPipe implements PipeTransform {

  transform(value: string): string {
    if (value) {
      return value.replace('.NS', '');
    }
    return value;
  }

}