import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  TemplateRef
} from '@angular/core';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { MessageTrackerService } from '../../../shared/services/message-tracker.service';
import { select, Store } from '@ngrx/store';
import * as fromShared from '../../../shared/store/reducers';
import { Observable, Subscription, Subject, of, iif, combineLatest, throwError } from 'rxjs';
import { Asi } from '../../models/asi';
import { AsiTabDetailsComponent } from './tabs/asi-tab-details/asi-tab-details.component';
import { AsiService } from '../../services/asi.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AsiTabDatesComponent } from './tabs/asi-tab-dates/asi-tab-dates.component';
import { FullAsi } from '../../models/full-asi';
import { AsiTabMessageBoardComponent } from './tabs/asi-tab-message-board/asi-tab-message-board.component';
import { AsiTabConcurrencesComponent } from './tabs/asi-tab-concurrences/asi-tab-concurrences.component';
import { AsiStatusType } from '../../enums/asi-status-type';
import * as fromAsiShared from '../../store/reducers';
import { AsiActions } from '../../store/actions';
import { Draft } from '../../models/draft';
import { DraftService } from '../../services/draft.service';
import { ParentChildDraft } from '../../models/parent-child-draft';
import { isFormInAddMode, isFormInDraftMode, getIdFromRoute } from '../../helpers/draft-helper';
import { FormGroup } from '@angular/forms';
import { AsiTabImpactsComponent } from './tabs/asi-tab-impacts/asi-tab-impacts.component';
import { AsiTabAttachmentsComponent } from './tabs/asi-tab-attachments/asi-tab-attachments.component';
import { AsiTabHistoryComponent } from './tabs/asi-tab-history/asi-tab-history.component';
import { MessageType } from '@shared/enums/message-type.enum';
import { MessageButtonSet } from '@shared/enums/message-button-set.enum';
import { iconStateError } from '@shared/consts/icons';
import { CanDeactivateForm } from '@shared/components/can-deactivate/can-deactivate-form';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Coi } from '@shared/models/user/coi';
import { UserSelectedCoiActions } from '@shared/store/actions';
import { AppSettingsService } from '@shared/services/app-settings.service';
import { takeUntil, take, catchError, first, skipWhile, switchMap, share, map } from 'rxjs/operators';
import { WorkCenter } from '@shared/models/user/work-center';
import { AsiTroubleTicket } from 'src/app/asi/models/asi-trouble-ticket';
import { SaveOperation } from '../../enums/save-operation';
import { SubscriptionService } from 'src/app/subscriptions/services/subscription.service';
import { userHasRoleInCoiById } from '@shared/models/user-utils';
import { enumStringToRoleId, RoleEnumeration } from '@shared/enums/role-enumeration';
import { BasicUser } from '@shared/models/user/basic-user';
import { RespondingOrgsService } from '@shared/responding-orgs-module/services/responding-orgs.service';
import AsiAssociationIds from '../../models/asi-association-ids';
import { RespondingOrgsEmails } from '@shared/responding-orgs-module/models/responding-orgs-emails';

@Component({
  selector: 'app-asi-request-form',
  templateUrl: './asi-request-form.component.html',
  styleUrls: ['./asi-request-form.component.scss'],
})
export class AsiRequestFormComponent extends CanDeactivateForm implements OnInit, OnDestroy, AfterViewInit {
  asiObservable$: Observable<Asi>;

  @ViewChild('asiTabs', { static: true }) tabset: TabsetComponent;

  @ViewChild(AsiTabDetailsComponent) detailsTab: AsiTabDetailsComponent;
  @ViewChild(AsiTabDatesComponent) datesTab: AsiTabDatesComponent;
  @ViewChild(AsiTabMessageBoardComponent) messagesTab: AsiTabMessageBoardComponent;
  @ViewChild(AsiTabConcurrencesComponent) concurrencesTab: AsiTabConcurrencesComponent;
  @ViewChild(AsiTabImpactsComponent) impactsTab: AsiTabImpactsComponent;
  @ViewChild(AsiTabAttachmentsComponent) attachmentsTab: AsiTabAttachmentsComponent;
  @ViewChild(AsiTabHistoryComponent) historyTab: AsiTabHistoryComponent;
  asiHeader: string;

  historyIdentifier: string;
  numberColumnTitle: string;
  error: string;
  subscriptions: Subscription[] = [];
  asi: Asi = new Asi();
  draftId: number;
  isInDraftMode: boolean;
  isInAddMode: boolean;
  parent: FormGroup;
  asi$: Observable<Asi>;
  asiId: number;
  fullAsi: FullAsi;
  iconStateError = iconStateError;
  troubleTickets: AsiTroubleTicket[] = [];
  deletedTicketOriginals: AsiTroubleTicket[] = [];

  detailsTabLoaded = false;
  phasesTabLoaded = false;
  impactsTabLoaded = false;
  concurrencesTabLoaded = false;
  attachmentsTabLoaded = false;
  messageBoardTabLoaded = false;
  historyTabLoaded = false;
  isSaving$: Observable<boolean>;
  saveClicked = false;
  emailModalRef: BsModalRef;
  hasReportPermissions: boolean;

  attachmentsCount = 0;

  parentFormGroup: FormGroup;

  emailEnabled = true;
  noPhasesOnAdd = false;

  unsubscribe$ = new Subject<void>();
  showDateExclamation = false;

  @ViewChild('emailComponent')
  modalTemplate: TemplateRef<any>;

  private $user: Observable<BasicUser>;
  private $selectedCoi: Observable<Coi>;
  private previousCoi: Coi = null;
  private selectedCoi: Coi = null;
  private $selectedWorkCenter: Observable<WorkCenter>;
  private selectedWorkCenter: WorkCenter = null;

  constructor(private sharedStore: Store<fromShared.State>,
    private asiService: AsiService,
    private draftService: DraftService,
    public messageService: MessageTrackerService,
    private router: Router,
    private asiStore: Store<fromAsiShared.State>,
    private activatedRoute: ActivatedRoute,
    private modalService: BsModalService,
    private appSettingsService: AppSettingsService,
    private subscriptionService: SubscriptionService,
    private respondingOrgsService: RespondingOrgsService
  ) {

    super();
    this.promptOnReload();

    this.parentFormGroup = new FormGroup({});

    this.detailsTabLoaded = false;
    this.historyIdentifier = 'ASI request log';
    this.numberColumnTitle = 'ASI number';

    this.$user = this.sharedStore.select(fromShared.getUser);

    this.$selectedCoi = this.sharedStore.pipe(
      select(fromShared.getUserSelectedCoi)
    );

    this.$selectedWorkCenter = this.sharedStore.pipe(
      select(fromShared.getUserSelectedWorkCenter)
    );

    this.asi$ = this.asiStore.pipe(select(fromAsiShared.getAsi));

    this.asiId = Number.parseInt(
      this.activatedRoute.snapshot.paramMap.get('id'),
      10
    );

    // read environment variables set in the various appsettings.
    // Note that these values are not guaranteed to exist.
    const appSettings = this.appSettingsService.getAppSettings();
    if (appSettings !== undefined) {
      const canEmailDescriptor = Object.getOwnPropertyDescriptor(appSettings, 'canEmail');
      if (canEmailDescriptor) {
        this.emailEnabled = canEmailDescriptor.value;
      }
    }
  }

  ngOnInit(): void {
    this.$user.pipe(
      first(user => !!user)
    ).subscribe( storeUser => {
      this.$selectedCoi
        .pipe(
          takeUntil(this.unsubscribe$),
          skipWhile(storeCoi => !storeCoi),
        )
        .subscribe(coi => {
          if (this.selectedCoi) {
            this.previousCoi = this.selectedCoi;
          }

          this.selectedCoi = coi;

          this.hasReportPermissions = userHasRoleInCoiById(
            storeUser,
            [
              enumStringToRoleId(RoleEnumeration.AsiManager),
              enumStringToRoleId(RoleEnumeration.AsiResponder),
              enumStringToRoleId(RoleEnumeration.AsiRequester)
            ],
            [coi.id]);

          // Handle the use case that the user has switched COIs while editing an event.
          // If previous coi is not null, the current coi and previous coi don't match,
          // and the events coi is not the same as the current coi, redirect to the dashboard.
          if (this.previousCoi) {
            if (coi.id !== this.previousCoi.id && this.asi.coiId !== this.selectedCoi.id) {
              this.router.navigateByUrl(`asi/view/${this.asiId}`);
              this.asiId = 0;
            }
          }
        });

    });

    this.$selectedWorkCenter
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(workCenter => {
        if (workCenter) {
          this.selectedWorkCenter = workCenter;
        }
      });

    this.subscriptions.push(
      this.asi$.subscribe(asi => {
        this.asi = asi;
      }));

    this.isSaving$ = this.asiStore.pipe(select(fromAsiShared.getIsSaving));
    this.isInDraftMode = isFormInDraftMode(this.activatedRoute);
    this.isInAddMode = isFormInAddMode(this.activatedRoute);
    this.draftId = this.isInDraftMode ? getIdFromRoute(this.activatedRoute) : 0;

    this.asiObservable$ = this.asiStore.pipe(select(fromAsiShared.getAsi));
    this.subscriptions.push(
      this.asiObservable$.subscribe(asi => {
        if (asi) {
          this.asi = asi;
          this.attachmentsCount = asi.asiAttachmentCount;
        }
      }));
  }

  ngAfterViewInit(): void {
    // need to do this to load the details tab and the asi first
    // then load the other tabs. Needed for editing ASIs
    this.tabset.tabs[0].active = true;
    setTimeout(() => {
      this.detailsTabSelected();

      // Force load of the dates and the impacts in the case of a draft.  This
      // is necessary to ensure that the dates and impacts are saved if the
      // ASI is changed from draft to actual ASI and the user previously added
      // dates or impacts to the draft.
      if (this.isInDraftMode) {
        this.phasesTabSelected();
        this.impactsTabSelected();
        this.impactsTab.loadImpacts();
      }
    });

    this.datesTab.asiDatesTabForm.statusChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(status => {
        if (this.detailsTab.isStatusDraft) {
          this.showDateExclamation = false;
          return;
        }

        if (status === 'VALID') {
          this.showDateExclamation = false;
        }
        else if (status === 'INVALID') {
          this.showDateExclamation = true;
        }
      });
  }

  /**
   * Fires when the form is closed.
   *
   * Currently used to unsubscribe to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * Returns true when all tabs are valid, else false.  Used by the save
   * method to determine whether to send data to the API or abort.
   */
  isFormValid(): boolean {
    if (this.detailsTab.statusFormControl.value === AsiStatusType.Draft) {
      this.detailsTab.draftTitleFormControl.markAsTouched();
      if (this.detailsTab.noLocationResults || this.detailsTab.noSubmitterOrgResults) {
        return false;
      }
      return this.detailsTab.draftTitleFormControl.valid;
    }
    else {
      if (!this.detailsTab.asiDetailsTabForm.valid) {
        this.detailsTab.asiDetailsTabForm.markAllAsTouched();
      }

      // Handles the case where the dates tab is invalid.  This can happen when
      // adding an ASI and the dates tab has been selected.  When editing an ASI,
      // if the dates tab has not been selected, there is not an opportunity to
      // perform the validation and the tab will be invalid; if the dates tab
      // has been selected, then the valid state will be correct.
      if (!this.datesTab.asiDatesTabForm.valid) {
        if (this.isInAddMode) {
          this.datesTab.asiDatesTabForm.markAllAsTouched();
          this.showDateExclamation = true;
        }
        else if (this.phasesTabLoaded) {
          this.datesTab.asiDatesTabForm.markAllAsTouched();
          this.showDateExclamation = true;
        }
      }

      // Account for the user never clicking the Dates tab
      // when updating a draft to non-draft.
      if (this.datesTab.phaseFormArray.length === 0) {
        this.showDateExclamation = true;
      }

      if (this.detailsTab.noLocationResults || this.detailsTab.noSubmitterOrgResults) {
        return false;
      }

      return this.parentFormGroup.valid && !this.showDateExclamation;
    }
  }

  /**
   * Save all ASI data and put into some sort of draft state. Validates all
   * fields before allowing the user to save.
   */
  saveAsiForm(): void {
    this.saveClicked = true;
    this.datesTab.updateSaveClickedState(this.saveClicked);

    if (!this.isFormValid()) {
      return;
    }

    const fullAsi: FullAsi = this.getAsiToSave();

    this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: true }));

    if (this.isInAddMode) {
      if (fullAsi.asiStatusId !== AsiStatusType.Draft) {
        this.createNewAsi(fullAsi);
      }
      else {
        this.addDraftAsi();
      }
    }
    else {
      if (this.isInDraftMode) {
        // If the ASI remaining a draft, update the existing entry.
        if (fullAsi.asiStatusId === AsiStatusType.Draft) {
          this.updateDraftAsi();
        }
        else {
          // ASI changed from a draft to an actual ASI.
          this.createNewAsi(fullAsi);
        }
      }
      else {
        fullAsi.saveOperation = SaveOperation.Edit;
        this.updateAsi(fullAsi);
      }
    }
  }

  /**
   * Display email composer component in modal
   */
  submitEmailForm(): void {
    let toEmails$: Observable<string[]> = of([]);
    let ccEmails$: Observable<string[]> = of([]);
    if (this.asi) {
      const asiAssociations$ = this.getAsiAssociations(this.asi.id);
      const correspondingEmails$ = this.getCorrespondingEmails(asiAssociations$);
      toEmails$ = this.getToEmails(correspondingEmails$);
      ccEmails$ = this.getCcEmails(asiAssociations$, correspondingEmails$);
    }

    this.emailModalRef = this.modalService.show(this.modalTemplate, {
      initialState: {
        toEmails$,
        ccEmails$
      }
    });
  }

  /**
   * Fetches ids of assets, locations and systems associated with this Asi
   *
   * @param asiId Id of the Asi to fetch associations for
   * @returns Observable containing AsiAssociationIds
   */
  private getAsiAssociations(asiId: number): Observable<AsiAssociationIds> {
    // fetch related snacs subscriptions for existing ASIs, ignore new ASIs
    return this.asiService.getRelatedIds(asiId).pipe(
      catchError(error => {
        this.showErrorToast('Failed to load Asi data');
        // rethrow the error here so that dependent calls below aren't called.
        return throwError(error);
      }),
      // declare the observable as shared to prevent others from calling the same endpoint
      // will also prevent other calls from happening if the service call errors out
      share()
    );
  }

  /**
   * Returns emails for responding organizations for this Asi based on
   * applicable locations returned
   *
   * @param asiAssociations$ Observable that holds associated Asis
   * @returns Observable containg the emails (required/optional) for the Asi
   */
  private getCorrespondingEmails(
    asiAssociations$: Observable<AsiAssociationIds>
  ): Observable<RespondingOrgsEmails> {
    return asiAssociations$.pipe(
      switchMap(asiAssociations =>
        // if there are location ids, fetch the emails for any matching responding orgs
        // otherwise, return a blank
        iif(() => !!asiAssociations.locationIds && asiAssociations.locationIds.length > 0,
          this.respondingOrgsService.getEmails(asiAssociations.locationIds)
            .pipe(
              catchError(() => {
                this.showErrorToast('Failed to load corresponding emails');
                return of(new RespondingOrgsEmails());
              })
            ),
          of(new RespondingOrgsEmails())
        ),
      ),
      share()
    );
  }

  /**
   * Displays an error toast with given message
   *
   * @param errorMessage Message to display in toast
   */
  private showErrorToast(errorMessage: string): void {
    this.messageService.showToast(MessageType.Error, errorMessage);
  }

  /**
   * Gets an observable of emails meant to display in the To section
   * of the email form
   *
   * @param correspondingEmails$ Correspondence emails for this Asi
   * @returns Observable with emails meant to display in the To section
   */
  private getToEmails(correspondingEmails$: Observable<RespondingOrgsEmails>): Observable<string[]> {
    return correspondingEmails$.pipe(
      map(emails => emails.requiredEmails),
    );
  }

  /**
   * Gets an observable of emails meant to display in the Cc section
   * of the email form
   *
   * @param asiAssociations$ Ids associated with this Asi
   * @param correspondingEmails$ Correspondence emails for this Asi
   * @returns Observable with emails meant to display in the Cc section
   */
  private getCcEmails(
    asiAssociations$: Observable<AsiAssociationIds>,
    correspondingEmails$: Observable<RespondingOrgsEmails>
  ): Observable<string[]> {
    return asiAssociations$.pipe(
      switchMap(asiAssociations => combineLatest([
        this.subscriptionService.getEmailsForObjects({
          asset: asiAssociations.assetIds ?? [],
          location: asiAssociations.locationIds ?? [],
          system: asiAssociations.systemIds ?? []
        }).pipe(catchError(() => {
          this.showErrorToast('Failed to load subscriber emails');
          return of([]);
        })),
        correspondingEmails$.pipe(
          map(emails => emails.optionalEmails),
          catchError(() => of([]))
        )
      ])),
      map((emails: string[][]) =>
        Array.from(
          emails.reduce((allCcEmails, currentEmailList) => {
            currentEmailList.forEach(email => allCcEmails.add(email));
            return allCcEmails;
          }, new Set<string>())
        )
      ),
    );
  }

  /**
   * Method saves the current contents of the form as a draft in the
   * persistent data store.  A toast notification is displayed if
   * there is an error saving the draft.
   */
  addDraftAsi(): void {
    const draftToSave = this.getDraftToSave();

    this.draftService.addParentChildDraft(draftToSave).subscribe(
      newDraft => {
        this.router.navigateByUrl(`asi/edit/draft/${newDraft.parent.id}`);
        this.draftId = newDraft.parent.id;
        this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: false }));
        this.displaySuccessMessage('Draft Saved');
      },
      error => {
        this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: false }));
        this.displayErrorMessage('Failed to save draft.  Please try again or contact the MADSS help desk.');
        this.error = error;
      }
    );
  }

  /**
   * Method converts the form values to JSON values to save as a draft.
   * It also maintains the parent child relationship between items.
   */
  getDraftToSave(): ParentChildDraft {
    const draftToSave = new ParentChildDraft();

    const asiDetails = this.detailsTab.getAsiToSave();
    asiDetails.coiId = this.selectedCoi.id;

    const asiDraft = new Draft();
    asiDraft.id = this.draftId;
    asiDraft.jsonValue = JSON.stringify(asiDetails);
    asiDraft.draftType = 'asi';
    asiDraft.title = this.detailsTab.draftTitleFormControl.value;
    const asiClassification = this.detailsTab.classificationFormControl.value;
    draftToSave.parent = asiDraft;

    if (this.datesTab) {
      const phaseDraft = new Draft();
      phaseDraft.id = this.datesTab.getPhaseDraftId();
      phaseDraft.parentId = this.draftId;
      phaseDraft.jsonValue = JSON.stringify(
        this.datesTab.getPhasesToSave(0, asiClassification)
      );
      phaseDraft.draftType = 'phase';
      phaseDraft.title = 'phase';
      draftToSave.children.push(phaseDraft);
    }

    if (this.messagesTab) {
      const entriesToSave = this.messagesTab.getMessagesToSave(0);
      if (entriesToSave && entriesToSave.length > 0) {
        const messageBoardDraft = new Draft();
        messageBoardDraft.id = this.messagesTab.getDraftId();
        messageBoardDraft.parentId = this.draftId;
        messageBoardDraft.jsonValue = JSON.stringify(entriesToSave);
        messageBoardDraft.draftType = 'message';
        messageBoardDraft.title = 'messages';
        draftToSave.children.push(messageBoardDraft);
      }
    }

    if (this.impactsTab) {
      const circuitDraft = this.impactsTab.getChildCircuitDraft();
      draftToSave.children.push(circuitDraft);

      const assetsDraft = this.impactsTab.getChildAssetDraft();
      draftToSave.children.push(assetsDraft);

      const systemsDraft = this.impactsTab.getChildSystemDraft();
      draftToSave.children.push(systemsDraft);

      const ticketsToSave = this.impactsTab.getTroubleTicketsToSave();
      if (ticketsToSave && ticketsToSave.length > 0) {
        const ticketDraft = new Draft();
        ticketDraft.id = this.impactsTab.troubleTicketsComponent.getDraftId();
        ticketDraft.parentId = this.draftId;
        ticketDraft.jsonValue = JSON.stringify(ticketsToSave);
        ticketDraft.draftType = 'troubleTickets';
        ticketDraft.title = 'troubleTickets';
        draftToSave.children.push(ticketDraft);
      }
    }

    return draftToSave;
  }

  updateDraftAsi(): void {
    const draftToSave = this.getDraftToSave();

    if (draftToSave.parent.title) {
      this.draftService.updateParentAndChild(draftToSave).subscribe(
        newDraft => {
          this.redirectTo(`asi/edit/draft/${newDraft.parent.id}`);
          this.draftId = newDraft.parent.id;
          this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: false }));
          this.displaySuccessMessage('Draft Saved');
        },
        error => {
          this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: false }));
          this.displayErrorMessage('Update draft failed.  Please try again or call the help desk.');
          this.error = error;
        }
      );
    }
    else {
      this.messageService.showModal({
        type: MessageType.Error,
        mainInstruction: 'Draft ASIs must contain a title.',
        buttonSet: MessageButtonSet.Close
      });
    }
  }

  /**
   * Call the service to create a record in the persistent data store.
   * Displays an error message if update fails.
   *
   * @param asi Asi to update in the data store.
   */
  createNewAsi(asi: FullAsi): void {
    asi.coiId = this.selectedCoi.id;
    asi.coiLabel = this.selectedCoi.abbreviation;

    // Get files to save
    const filesToSave = this.attachmentsTab.getFilesToSave();
    asi.asiFiles = filesToSave.asiFiles;

    this.asiService
      .addAsi(asi, filesToSave.files)
      .pipe(take(1))
      .subscribe(createdAsi => {
        if (createdAsi !== undefined) {
          // Update the store with the result of the operation.
          this.asiStore.dispatch(AsiActions.updateAsi(createdAsi));
          this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: false }));
          this.redirectTo(`asi/edit/${createdAsi.id}`);
          this.displaySuccessMessage('ASI saved.');
        }
      },
        error => {
          if (error) {
            if (error.status === 400) {
              this.displayErrorMessage('Save failed.  Please ensure all required fields have been completed.');
            }
            else {
              this.displayErrorMessage('Save failed with an unexpected error. Please try again.  If the problem persists please contact the help desk.');
            }

            this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: false }));
          }
        }
      );
  }

  /**
   * Displays a toast notification with the provided message.
   *
   * @param message Message to display to the user.
   */
  displaySuccessMessage(message: string): void {
    this.messageService.showToast(MessageType.Success, message);
  }

  /**
   * Displays a modal message with the provided error message.
   *
   * @param message Error message to display in the toast notification.
   */
  displayErrorMessage(message: string): void {
    // TODO: We may want to dive deeper into displaying a message. It would
    // be good to get the message from the errors of the HttpResponse.
    this.messageService.showModal({
      type: MessageType.Error,
      mainInstruction: message,
      buttonSet: MessageButtonSet.Close
    });
  }

  /**
   * Call the service to update a record in the persistent data store.
   * Displays an error message if update fails.
   *
   * @param asi Asi to update in the data store.
   */
  updateAsi(asi: FullAsi): void {
    const filesToSave = this.attachmentsTab.getFilesToSave();
    asi.asiFiles = filesToSave.asiFiles;

    this.asiService
      .updateAsi(asi, filesToSave.files)
      .pipe(take(1))
      .subscribe(
        updatedAsi => {
          if (updatedAsi !== undefined) {
            this.redirectTo(`asi/edit/${updatedAsi.id}`);
            this.asiStore.dispatch(AsiActions.updateAsi(updatedAsi));
            this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: false }));

            this.displaySuccessMessage('Updates to the ASI have been saved.');
          }
        },
        error => {
          if (error.error.title !== null) {
            const errorMessage = error.error.title;
            this.error = errorMessage;
            this.asiStore.dispatch(AsiActions.setIsSaving({ isSaving: false }));

            // eslint-disable-next-line max-len
            this.displayErrorMessage('There was a problem saving this ASI. Please try again. If the problem persists, please contact the MADSS help desk.');
          }
        }
      );
  }

  /**
   * Method used to force the component to be re-created.  With all of the nested
   * tabs in the form this is the cleanest way to make sure all of the various
   * load checks are reset propertly.  Eventually we should be using NGRX to
   * load everthing.
   */
  redirectTo(uri: string): void {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
      this.router.navigate([uri]));
  }

  /**
   * Sets the title for the Asi if we are in edit mode
   *
   * @param asiName The name of the asi to load.
   */
  setAsiHeader(asiName: string): void {
    this.asiHeader = asiName;
  }

  /**
   * loads the information for the details tab
   */
  detailsTabSelected(): void {
    if (!this.detailsTabLoaded) {
      this.detailsTab.loadAsi();
      this.detailsTabLoaded = true;

      this.parentFormGroup.addControl('detailsTab', this.detailsTab.asiDetailsTabForm);
    }
  }

  /**
   * loads the information for the phases tab
   */
  phasesTabSelected(): void {
    if (!this.phasesTabLoaded) {
      this.datesTab.loadPhases();
      this.datesTab.updateSaveClickedState(this.saveClicked);
      this.phasesTabLoaded = true;

      this.parentFormGroup.addControl('datesTab', this.datesTab.asiDatesTabForm);
    }
  }

  /**
   * loads the information for the imapcts tab
   */
  impactsTabSelected(): void {
    if (!this.impactsTabLoaded) {
      this.impactsTab.loadImpacts();
      this.impactsTabLoaded = true;

      this.parentFormGroup.addControl('impactsTab', this.impactsTab.asiImpactsTabForm);
    }
  }

  /**
   * loads the information for the responses tab
   */
  concurrencesTabSelected(): void {
    if (!this.concurrencesTabLoaded) {
      this.concurrencesTab.loadConcurrences();
      this.concurrencesTabLoaded = true;

      this.parentFormGroup.addControl('concurrencesTab', this.concurrencesTab.asiConcurrencesTabForm);
    }
  }

  /**
   * loads the information for the attachments tab
   */
  attachmentsTabSelected(): void {
    if (!this.attachmentsTabLoaded) {
      this.attachmentsTab.loadAttachments();
      this.attachmentsTabLoaded = true;
    }
  }

  /**
   * loads the information for the message board tab
   */
  messageBoardTabSelected(): void {
    if (!this.messageBoardTabLoaded) {
      this.messagesTab.loadMessages();
      this.messageBoardTabLoaded = true;
    }
  }

  /**
   * loads the information for the history tab
   */
  historyTabSelected(): void {
    if (!this.historyTabLoaded) {
      this.historyTab.loadHistory(this.asi.id);
      this.historyTabLoaded = true;
    }
  }

  /**
   * method will load the values of each tab that is defined
   * and return the values to be saved to the database.
   */
  getAsiToSave(): FullAsi {
    const fullAsi = this.detailsTab.getAsiToSave();

    if (this.isInAddMode || this.isInDraftMode) {
      fullAsi.coiId = this.selectedCoi.id;

      if (this.selectedWorkCenter !== null) {
        fullAsi.workCenterId = this.selectedWorkCenter.id;
      }
    }

    const asiClassification = this.detailsTab.classificationFormControl.value;

    fullAsi.draftId = this.draftId;

    // grab the dates tab information to be associated with the asi.
    fullAsi.phases = this.datesTab.getPhasesToSave(fullAsi.id, asiClassification);

    // check if the asi is a draft, if not then save the message board entries.
    if (fullAsi.asiStatusId !== AsiStatusType.Draft) {
      // make sure it has been rendered as new asis do not render this tab.
      if (this.messagesTab !== undefined) {
        fullAsi.messageBoardEntries = this.messagesTab.getMessagesToSave(fullAsi.id);
      }

      // make sure it has been rendered as new asis do not render this tab.
      if (this.concurrencesTab !== undefined) {
        fullAsi.concurrences = this.concurrencesTab.getConcurrencesToSave(fullAsi.id, asiClassification);
        fullAsi.responseDueDate = this.concurrencesTab.getResponseDueDate();
      }

      if (this.impactsTab !== undefined) {
        fullAsi.resources = this.impactsTab.getResourcesToSave();
        fullAsi.asiImpactAssessments = this.impactsTab.getImpactAssessmentsToSave();
        fullAsi.asiTroubleTickets = this.impactsTab.getTroubleTicketsToSave();
      }
    }
    // this is needed to override the guard for changes in the form
    this.parentFormGroup.markAsPristine();

    return fullAsi;
  }

  /**
   * Determines if the user should be allowed to leave the current page
   *
   * @returns true if the form is has not been edited by the user. False
   * if there is an open dialog to be closed. Or, boolean promise linked
   * a confirmation modal dialog that will result true/false depending on
   * if the user clicks "discard".
   */
  canDeactivate(): Observable<boolean> | boolean {
    if (this.modalService.getModalsCount() > 0) {
      return false;
    }

    if (this.parentFormGroup.pristine) {
      this.cancelPromptOnReload();
      return true;
    }
    const done = this.messageService.showUnsavedChangesModal();

    // If the user has chosen to continue editing, dispatch the last coi so the
    // users coi does not change. If not, allow navigation to the dashboard and
    // skip setting the users coi back.
    done.subscribe(reload => {
      if (!reload) {
        if (this.previousCoi) {
          if (this.selectedCoi.id !== this.previousCoi.id && this.asi.coiId === this.previousCoi.id) {
            this.sharedStore.dispatch(UserSelectedCoiActions.setUserSelectedCoi({ coi: this.previousCoi }));
          }
        }
      }
    });

    if (done) {
      this.cancelPromptOnReload();
    }
    return done;
  }

  /**
   * Determines whether to display exclamation point on details tab
   *
   * @returns true if the Save button has been clicked and the ASI is
   * not a draft and the details tab is invalid or the ASI is a draft
   * and the title is invalid.  This will also mark the tab as invalid
   * if the details tab is valid but there is no location or submitter org.
   */
  checkDetailTabStatus(): boolean {
    if (this.parentFormGroup.controls.detailsTab !== undefined) {
      const isDetailsTabValid = this.parentFormGroup.controls.detailsTab;

      // TODO: This if should probably be split up to make it easier to understand
      if (
        (
          (
            !isDetailsTabValid &&
            this.detailsTab.statusFormControl.value !== AsiStatusType.Draft
          ) ||
            // TODO: Verify that this operator precedence is correct. The parens
            //   are added, but this is what it was doing before the parens were
            //   added because && has higher precedence than ||
          (
            (
              isDetailsTabValid &&
              this.detailsTab.noLocationResults
            ) ||
            this.detailsTab.noSubmitterOrgResults
          ) ||
          (
            this.detailsTab.statusFormControl.value === AsiStatusType.Draft &&
            !this.detailsTab.draftTitleFormControl.valid
          )
        ) &&
        this.saveClicked) {
        return true;
      }
    }
    return false;
  }
}
