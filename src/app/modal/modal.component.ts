
  import { Component, TemplateRef, OnInit} from '@angular/core';
  import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

  // https://stackblitz.com/edit/angular-modal-bootstap?file=index.html

@Component({
  selector: "app-modal",
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.css"]
})
export class ModalComponent implements OnInit {
    name = 'Modal (Bootstrap)';

    /* @ViewChild('emailComponent') 
    modalTemplate: TemplateRef<any>*/
    modalRef = new BsModalRef;

    //subscriptions: Subscription[] = [];
    
    constructor(public modalService: BsModalService) {}
   
    ngOnInit() {
      this.modalService.onHide.subscribe((e) => {
          // console.log('close', this.modalService.config.initialState);
      });
    }
  
    openModal(modalTemplate: TemplateRef<any>): void {
      const user = { id: 10 };
      this.modalRef = this.modalService.show(modalTemplate, {
        initialState : user
        
      });
    }
  }
