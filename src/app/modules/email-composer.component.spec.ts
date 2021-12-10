import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_BASE_HREF, CommonModule, DecimalPipe } from '@angular/common';
import { EmailComposerComponent } from './email-composer.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterTestingModule } from '@angular/router/testing';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { AttachmentsTableFormModule } from '@shared/attachments-module/attachments-table-public-module';
import { NgxFileDropModule } from 'ngx-file-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideMockStore } from '@ngrx/store/testing';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrModule } from 'ngx-toastr';
import { StoreModule } from '@ngrx/store';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';
import { reducers } from '@shared/attachments-module/store/reducers';
import { EffectsModule } from '@ngrx/effects';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MessageTrackerService } from '@shared/services/message-tracker.service';
import * as FromShared from '../../../store/reducers';
import * as fromAttachments from '@shared/attachments-module/store/reducers/attachments-table.reducers';
import { of } from 'rxjs';
import { Renderer2 } from '@angular/core';
import { EmailTypeaheadStubComponent } from '../add-contact-to-email/email-typeahead/email-typeahead.stub.component';
import { EmailTypeaheadComponent } from '../add-contact-to-email/email-typeahead/email-typeahead.component';
import { EmailTypeaheadSearchResultsComponent } from '../add-contact-to-email/email-typeahead-results/email-typeahead-results.component';
import { EmailAddress } from '@shared/models/email-address';
import { RootState } from '@shared/models/root-state';

describe('EmailComposerComponent', () => {
  let component: EmailComposerComponent;
  let fixture: ComponentFixture<EmailComposerComponent>;
  let initialState: RootState;

  beforeEach(async(() => {
    initialState = {
      shared: FromShared.initialSharedState,
      attachmentsTablePublic: {
        attachmentsTable: fromAttachments.initialState
      }
    };
    TestBed.configureTestingModule({
      declarations: [
        EmailComposerComponent,
        EmailTypeaheadStubComponent,
        EmailTypeaheadComponent,
        EmailTypeaheadSearchResultsComponent,
      ],
      imports: [
        CommonModule,
        BrowserAnimationsModule,
        FormsModule,
        NgxFileDropModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        RouterModule.forRoot([]),
        AttachmentsTableFormModule,
        StoreModule.forRoot(reducers),
        EffectsModule.forRoot([]),
        ModalModule.forRoot(),
        FontAwesomeModule,
        AccordionModule.forRoot(),
        ToastrModule.forRoot(),
        CollapseModule.forRoot(),
      ],
      providers: [
        BsModalService,
        DecimalPipe,
        provideMockStore({ initialState: initialState }),
        {
          provide: MessageTrackerService,
          useValue: {
            showUnsavedChangesModal: jest.fn( () => of(true))
          },
        },
        {
          provide: APP_BASE_HREF,
          useValue: '/'
        },
        Renderer2,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailComposerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not override existing emails if observable ones exist', () => {
    component.toEmailObjects.push(new EmailAddress({
      name: 'test',
      members: [{email: 'test@test.com', name: 'test@test.com'}]
    }));
    component.ccEmailObjects.push(new EmailAddress({
      name: 'test',
      members: [{email: 'test@test.com', name: 'test@test.com'}]
    }));
    component.toEmails$ = of(['test1@test.com', 'test2@test.com']);
    component.ccEmails$ = of(['test3@test.com', 'test4@test.com']);
    fixture.detectChanges();
    expect(component.toEmailObjects.length).toBe(3);
    expect(component.ccEmailObjects.length).toBe(3);
  });
});
