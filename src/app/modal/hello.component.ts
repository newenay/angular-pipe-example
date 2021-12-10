import { Component, Input } from '@angular/core';

@Component({
  selector: 'modalTemplate',
  template: `<h4>Parent Title: {{name}}</h4>`,
  styles: [`h1 { font-family: Lato; }`]
})
export class HelloComponent  {
  @Input() name: any;
}
