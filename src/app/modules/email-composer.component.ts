import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy } from '@angular/core';
import { CanDeactivateForm } from '../../can-deactivate/can-deactivate-form';
import { Observable, Subscription } from 'rxjs';
import { EmailActions } from '../../../store/actions';
import { SiteNavigationHelper } from '../../../../helpers/site-navigation-helper';
import { Email } from '../../../models/email';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Store, select } from '@ngrx/store';
import * as fromShared from '../../../store/reducers';
import { MessageButtonSet } from '../../../enums/message-button-set.enum';
import { MessageType } from '../../../enums/message-type.enum';
import { MessageTrackerService } from '@shared/services/message-tracker.service';
import { AttachmentsTableComponent } from '@shared/attachments-module/components/attachments-table/attachments-table.component';
import { iconAttachment, iconOpenCloseUp, iconOpenCloseDown } from '@shared/consts/icons';
import * as fromAttachmentsTable from '@shared/attachments-module/store/reducers';
import { AttachmentsActions } from '@shared/attachments-module/store/actions';
import { Attachment } from '../../../models/attachment';
import { ContactActions } from 'src/app/user-management/store/actions';
import * as fromUserManagement from 'src/app/user-management/store/reducers';
import { EmailAddress } from '../../../models/email-address';
import { FileWithoutContents } from '@shared/attachments-module/models/file-without-contents';
import { take } from 'rxjs/operators';

/**
 * Reusable component that allows the user to compose email messsages.
 */
@Component({
  selector: 'app-email-composer',
  templateUrl: './email-composer.component.html',
  styleUrls: ['./email-composer.component.scss']
})
export class EmailComposerComponent extends CanDeactivateForm implements OnInit, OnDestroy{
  attachment: File = null;

  @Input() toEmails$: Observable<string[]>;
  @Input() ccEmails$: Observable<string[]>;

  @ViewChild('fileLabel', { static: false }) fileLabel: ElementRef;
  @Input() emailId = 0;
  @ViewChild(AttachmentsTableComponent, { static: false }) attachmentsTable: AttachmentsTableComponent;

  email: Email;
  email$: Observable<Email>;
  isEmailLoading$: Observable<boolean>;
  isEmailSaving$: Observable<boolean>;
  errorMessage$: Observable<string>;

  attachmentFiles: File[];
  attachmentMetadata: FileWithoutContents[];

  subscriptions: Subscription[] = [];
  saveText = 'Send';

  emailForm: FormGroup;
  subjectControl: FormControl;
  bodyControl: FormControl;
  classificationControl: FormControl;
  draftControl: FormControl;

  toEmailObjects: EmailAddress[] = [];
  ccEmailObjects: EmailAddress[] = [];

  iconAttachment = iconAttachment;
  iconUp = iconOpenCloseUp;
  iconDown = iconOpenCloseDown;

  constructor(
    public messageService: MessageTrackerService,
    private store: Store<fromShared.State>,
    private userManagementStore: Store<fromUserManagement.State>,
    private navHelper: SiteNavigationHelper,
    private attachmentsTableStore: Store<fromAttachmentsTable.State>,
  ) {
    super();
    this.promptOnReload();

    this.subscriptions.push(this.attachmentsTableStore.pipe(
      select(fromAttachmentsTable.getFilesToSaveArray)
    ).subscribe( ( files: File[] ) =>
      this.attachmentFiles = files
    ));

    this.subscriptions.push(this.attachmentsTableStore.pipe(
      select(fromAttachmentsTable.getAttachmentsArray)
    ).subscribe( (attachmentMetadata: FileWithoutContents[] ) =>
      this.attachmentMetadata = attachmentMetadata
    ));
  }

  /**
   * Initializer
   */
  ngOnInit(): void {
    this.initializeFormGroup();
    this.attachmentsTableStore.dispatch(AttachmentsActions.resetState());

    this.email$ = this.store.pipe(select(fromShared.getEmailCurrent));
    this.isEmailLoading$ = this.store.pipe(select(fromShared.getEmailIsLoading));
    this.isEmailSaving$ = this.store.pipe(select(fromShared.getEmailIsSaving));
    this.errorMessage$ = this.store.pipe(select(fromShared.getEmailErrorMessage));

    // TODO: Set up field/form requirements (Length, format...)

    this.subscriptions.push(this.email$.subscribe((email) => {
      this.email = email;
      if (this.email) {
        this.subjectControl.setValue(this.email.subject);
        this.bodyControl.setValue(this.email.body);
        this.draftControl.setValue(this.email.draft);
        // TODO: Populate to and cc tags
      }
    }));

    if (this.toEmails$){
      this.toEmails$
        .pipe(take(1))
        .subscribe(emails => {
          this.toEmailObjects = this.toEmailObjects.concat(emails.filter(email => !!email)
            .map(email => new EmailAddress({
              name: email,
              members: [{email, name: email}]
            })));
        });
    }

    if (this.ccEmails$){
      this.ccEmails$
        .pipe(take(1))
        .subscribe(emails => {
          this.ccEmailObjects = this.ccEmailObjects.concat(emails.filter(email => !!email)
            .map(email => new EmailAddress({
              name: email,
              members: [{email, name: email}]
            })));
        });
    }

    // This may *still* be null or empty, so we need to check again to
    // confirm if this is a saved or new email.
    if (this.emailId){
      this.store.dispatch(EmailActions.getEmail({id: this.emailId}));
    }

    this.userManagementStore.dispatch(ContactActions.getAllContacts());
  }

  /**
   * Means of initializing the Form Group and setting up the requirements
   * for validations.
   */
  initializeFormGroup(): void {
    this.bodyControl = new FormControl('', [Validators.required]);
    this.subjectControl = new FormControl('', [Validators.required]);
    this.draftControl = new FormControl('', []);

    this.emailForm = new FormGroup({
      bodyControl: this.bodyControl,
      subjectControl: this.subjectControl,
      draft: this.draftControl,
    });
  }

  /**
   * Sends the email ot the server. If it's a draft, it will be saved instead of dispatched.
   */
  onSend(): void {
    if (this.emailForm.valid) {
      if (! this.email) {
        this.email = new Email();
      }
      this.email.id = this.emailId;

      const reader = new FileReader();

      // Declared outside of attachments.map for memory reasons.
      let base64Attachment: string;
      if (! this.email.attachments) {
        this.email.attachments = [];
      }

      const toEmailMembers = this.toEmailObjects.map(object => object.members); // array of arrays
      const flattenedToArray = [].concat(...toEmailMembers); // array of {email, name}

      const ccEmailMembers = this.ccEmailObjects.map(object => object.members); // array of arrays
      const flattenedCcArray = [].concat(...ccEmailMembers); // array of {email, name}

      // Understandable for an email
      /* eslint-disable-next-line id-length */
      this.email.to = flattenedToArray.map(item => item.email);
      // Understandable for an email
      /* eslint-disable-next-line id-length */
      this.email.cc = flattenedCcArray.map(item => item.email);

      // this.email.classification = this.classificationControl.value,
      this.email.subject = this.subjectControl.value;
      // Incorporates null/undefined checks
      this.email.draft = this.draftControl.value ? true : false;
      this.email.body = this.bodyControl.value;

      if (this.attachmentFiles !== null && this.attachmentFiles.length > 0){
        const uploadPromise = new Promise((resolve, reject) => {
          this.attachmentFiles.forEach((attachment: File) => {

            const fileAttachment = new Attachment();
            const fileMetadata = this.attachmentMetadata.find(metaData =>
              metaData.fileName === attachment.name
            );

            fileAttachment.classification = fileMetadata.jsonIsmClassification;
            fileAttachment.fileName = attachment.name;
            fileAttachment.fileType = attachment.type;
            fileAttachment.fileSize = attachment.size;
            fileAttachment.emailId = this.emailId;

            // Define what happens when we read files
            reader.onload = event => {
              // Typically, the file will be read/cached as a binary array,
              // which will be treated as an ArrayBuffer in this context
              if (typeof event.target.result === ArrayBuffer.toString()) {
                // Forcibly converts a Binary Array of Uint16 characters to a string.
                // This is more common in images and some PDFs being parsed in this
                // fashion
                base64Attachment = String.fromCharCode.apply(
                  null,
                  new Uint16Array(event.target.result as ArrayBuffer)
                );
                base64Attachment = btoa(base64Attachment);
              }
              else {
                // We have a file being represented as a string. Good
                const stringFile = event.target.result as string;

                if (stringFile.split(',').length > 1) {
                  // the file is being encoded as something like: image/jpeg;base64,/9j/4A...
                  // but we want it to be like /9j/4A... and the cont type data is
                  /// already stored in the attachment object
                  base64Attachment = stringFile.split(',')[1];
                }
                else {
                  base64Attachment = stringFile;
                }
              }
              fileAttachment.base64EncodedFile = base64Attachment;

              this.email.attachments.push(fileAttachment);
            };

            // If something goes wrong, resolve the promise with a Rejection
            reader.onerror = event => {reject(event); };
            // Actually read files
            reader.readAsDataURL(attachment);
            // Once we've completed the read, we can resolve with success
            reader.onloadend = event => {resolve(event); };
          });
        });

        // We await the promise of the file upload so that it has time to
        // complete before we send the email. Otherwise, we might not have
        // the files attached
        uploadPromise.then(() => {
          this.store.dispatch(EmailActions.saveEmail(this.email));
          this.endFunction();
        });
      }
      // No attachments
      else{
        this.email.attachments = null;
        this.store.dispatch(EmailActions.saveEmail(this.email));
        this.endFunction();
      }
    }
    else{
      console.log(this.emailForm.getError);
      // This will mark anything that is invalid as invalid
      this.emailForm.markAllAsTouched();

      this.messageService.showModal({
        type: MessageType.Error,
        buttonSet: MessageButtonSet.Close,
        mainInstruction: 'Please correct email form',
        secondaryInstruction: 'One or more errors were found on the email form.',
      });
    }
  }

  /**
   * Determine if the user can leave the page, or if they should be warned of errors
   */
  canDeactivate(): Observable<boolean> | boolean {
    if (this.emailForm.pristine) {
      this.cancelPromptOnReload();
      return true;
    }

    const done = this.messageService.showUnsavedChangesModal();
    if (done){
      this.cancelPromptOnReload();
    }
    return done;
  }

  @Input()
  endFunction(): void{
    this.navHelper.goBack('/');
  }

  /**
   * Called when cancel button is clicked
   */
  onCancel(): void {
    this.store.dispatch(EmailActions.completeEditInteraction());
    this.endFunction();
  }

 /**
  * Handler for draft checkbox
  *
  * @param event the checkbox click event to process
  */
  onDraftCheckChange(event: any): void {
    this.saveText = event.target.checked ? 'Save' : 'Send';
    this.draftControl.setValue(event.target.checked);
  }

  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    if (this.subscriptions){
      this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }
  }

  onItemsCreated(emails: string[], line: string): void {

    const emailObjects = emails?.map(email => {
      email = email.toLocaleLowerCase();
      return new EmailAddress({
        id: '0',
        name: email,
        altname: email,
        objectType: 'emailAddress',
        members: [{email, name: email}]
      });
    });

    // compare to email.name since onItemCreated() uses email.name
    if (line.toLowerCase() === 'to') {
      const toEmails = new Set<string>(
        this.toEmailObjects.map(
          emailObject => emailObject.name?.toLocaleLowerCase()
        )
      );

      emailObjects.forEach(email => {
        if (!toEmails.has(email.name)){
          this.toEmailObjects.push(email);
          toEmails.add(email.name);
        }
      });
    }
    else {
      const ccEmails = new Set<string>(
        this.ccEmailObjects.map(
          emailObject => emailObject.name?.toLocaleLowerCase()
        )
      );

      emailObjects.forEach(email => {
        if (!ccEmails.has(email.name)) {
          this.ccEmailObjects.push(email);
          ccEmails.add(email.name);
        }
      });
    }
  }

  /**
   * Actions to perform when an item is
   * selected from the search results
   *
   * @param event the resultSelected event to process
   * @param line the email address line - to or cc
   */
  onResultSelected(event: EmailAddress, line: string): void {
    const emailObject: EmailAddress = event;

    if (line.toLowerCase() === 'to') {
      if (!this.toEmailObjects.some(emailObj => emailObj.id === emailObject.id)) {
        this.toEmailObjects.push(emailObject);
       }
    }
    else {
      if (!this.ccEmailObjects.some(emailObj => emailObj.id === emailObject.id)) {
        this.ccEmailObjects.push(emailObject);
      }
    }
  }

  /**
   * Actions to perform when an item is
   * added
   *
   * @param event the itemCreated event to process
   * @param line the email address line - to or cc
   */
  onItemCreated(event: string, line: string): void {
    const emailObject: EmailAddress =
    {
      id: '0',
      name: event,
      altname: event,
      objectType: 'emailAddress',
      members: [{email: event, name: event}]
    };

    if (line.toLowerCase() === 'to') {
      if (!this.toEmailObjects.some(emailObj => emailObj.name === emailObject.name)) {
        this.toEmailObjects.push(emailObject);
      }
    }
    else {
      if (!this.ccEmailObjects.some(emailObj => emailObj.name === emailObject.name)) {
        this.ccEmailObjects.push(emailObject);
      }
    }

  }

  /**
   * Actions to perform when the user
   * clicks on the delete icon of an email
   * chip
   */
  removeChip(event: PointerEvent, index: any): void {
    const target = event.target as HTMLElement;
    const elementId = target.id;

    if (elementId.toLowerCase() === 'to') {
      this.toEmailObjects.splice(index, 1);
    }
    else {
      this.ccEmailObjects.splice(index, 1);
    }

  }
}
