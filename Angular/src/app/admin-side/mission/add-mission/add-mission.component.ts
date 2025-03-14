import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminsideServiceService } from 'src/app/service/adminside-service.service';
import { NgToastService } from 'ng-angular-popup';
import { Mission } from 'src/app/model/cms.model';

@Component({
  selector: 'app-add-mission',
  templateUrl: './add-mission.component.html',
  styleUrls: ['./add-mission.component.css']
})
export class AddMissionComponent implements OnInit {
  addMissionForm: FormGroup;
  endDateDisabled: boolean = true;
  regDeadlineDisabled: boolean = true;
  formValid: boolean = false;
  countryList: any[] = [];
  cityList: any[] = [];
  missionThemeList: any[] = [];
  missionSkillList: any[] = [];
  formData = new FormData();
  imageListArray: any[] = [];

  constructor(
    public fb: FormBuilder,
    public service: AdminsideServiceService,
    public toastr: ToastrService,
    public router: Router,
    public datePipe: DatePipe,
    private toast: NgToastService
  ) { }

  ngOnInit(): void {
    this.addMissionFormValid();
    this.setStartDate();
    this.CountryList();
    this.GetMissionSkillList();
    this.GetMissionThemeList();
  }
  

  addMissionFormValid() {
    this.addMissionForm = this.fb.group({
      countryId: [null, Validators.compose([Validators.required])],
      cityId: [null, Validators.compose([Validators.required])],
      missionTitle: [null, Validators.compose([Validators.required])],
      missionDescription: [null, Validators.compose([Validators.required])],
      startDate: [null, Validators.compose([Validators.required])],
      endDate: [null, Validators.compose([Validators.required])],
      missionThemeId: [null, Validators.compose([Validators.required])],
      missionSkillId: [null, Validators.compose([Validators.required])],
      missionType: [null, Validators.compose([Validators.required])],
      missionImages: [null],
      totalSheets: [null, Validators.compose([Validators.required])]
    });
  }

  get countryId() { return this.addMissionForm.get('countryId') as FormControl; }
  get cityId() { return this.addMissionForm.get('cityId') as FormControl; }
  get missionTitle() { return this.addMissionForm.get('missionTitle') as FormControl; }
  get missionDescription() { return this.addMissionForm.get('missionDescription') as FormControl; }
  get startDate() { return this.addMissionForm.get('startDate') as FormControl; }
  get endDate() { return this.addMissionForm.get('endDate') as FormControl; }
  get missionThemeId() { return this.addMissionForm.get('missionThemeId') as FormControl; }
  get missionSkillId() { return this.addMissionForm.get('missionSkillId') as FormControl; }
  get missionImages() { return this.addMissionForm.get('missionImages') as FormControl; }
  get totalSheets() { return this.addMissionForm.get('totalSheets') as FormControl; }

  setStartDate() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    this.addMissionForm.patchValue({
      startDate: todayString
    });
    this.endDateDisabled = false;
    this.regDeadlineDisabled = false;
  }

  CountryList() {
    this.service.CountryList().subscribe((data: any) => {
      if (data.result != 1) {
        this.countryList = data.data;
      } else {
        this.toast.error({ detail: "ERROR in country ", summary: data.message, duration: 3000 });
      }
    });
  }

  CityList(countryId: any) {
    countryId = countryId.target.value;
    this.service.CityList(countryId).subscribe((data: any) => {
      if (data.result != 1) {
        this.cityList = data.data;
      } else {
        this.toast.error({ detail: "ERROR in city", summary: data.message, duration: 3000 });
      }
    });
  }

  GetMissionSkillList() {
    this.service.GetMissionSkillList().subscribe((data: any) => {
      if (data.result == 1) {
        this.missionSkillList = data.data;
      } else {
        this.toast.error({ detail: "ERROR", summary: data.message, duration: 3000 });
      }
    }, err => this.toast.error({ detail: "ERROR", summary: err.message, duration: 3000 }))
  }

  GetMissionThemeList() {
    this.service.GetMissionThemeList().subscribe((data: any) => {
      if (data.result == 1) {
        this.missionThemeList = data.data;
      } else {
        this.toast.error({ detail: "ERROR", summary: data.message, duration: 3000 });
      }
    }, err => this.toast.error({ detail: "ERROR", summary: err.message, duration: 3000 }))
  }

  OnSelectedImage(event: any) {
    const files = event.target.files;
    if (this.imageListArray.length > 5) {
      return this.toast.error({ detail: "ERROR", summary: "Maximum 6 images can be added.", duration: 3000 });
    }
    if (files) {
      this.formData = new FormData();
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imageListArray.push(e.target.result);
        }
        reader.readAsDataURL(file)
      }
      for (let i = 0; i < files.length; i++) {
        this.formData.append('file', files[i]);
        this.formData.append('moduleName', 'Mission');
      }
      console.log(this.formData);
    }
  }

  async OnSubmit() {
    this.formValid = true;
    let imageUrl: any[] = [];
    let value = this.addMissionForm.value;
    value.missionSkillId = Array.isArray(value.missionSkillId) ? value.missionSkillId.join(',') : value.missionSkillId;
    value.missionThemeId = Array.isArray(value.missionThemeId) ? value.missionThemeId.join(',') : value.missionThemeId;

    // Format startDate and endDate to ISO string format
    value.startDate = new Date(value.startDate).toISOString();
    value.endDate = new Date(value.endDate).toISOString();

    if (this.addMissionForm.valid) {
      if (this.imageListArray.length > 0) {
        await this.service.UploadImage(this.formData).pipe().toPromise().then((res: any) => {
          if (res.success) {
            imageUrl = res.data;
          }
        }, err => {
          this.toast.error({ detail: "ERROR", summary: err.message, duration: 3000 });
        });
      }

      let imgUrlList = imageUrl.map(e => e.replace(/\s/g, "")).join(",");
      value.missionImages = imgUrlList;

      // Map the form values to the API payload structure
      const missionPayload = {
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        isDeleted: false,
        id: 0,  // Assuming id is 0 for new missions
        missionTitle: value.missionTitle,
        missionDescription: value.missionDescription,
        missionOrganisationName: '', // Adjust as needed
        missionOrganisationDetail: '', // Adjust as needed
        countryId: value.countryId,
        cityId: value.cityId,
        startDate: value.startDate,
        endDate: value.endDate,
        missionType: value.missionType, // Include missionType from form value
        totalSheets: value.totalSheets || null,
        registrationDeadLine: value.endDate, // Adjust as needed
        missionThemeId: value.missionThemeId,
        missionSkillId: value.missionSkillId,
        missionImages: value.missionImages,
        missionDocuments: '', // Adjust as needed
        missionAvilability: '', // Adjust as needed
        missionVideoUrl: '', // Adjust as needed
        countryName: '', // NotMapped
        cityName: '', // NotMapped
        missionThemeName: '', // NotMapped
        missionSkillName: '', // NotMapped
        missionStatus: '', // NotMapped
        missionApplyStatus: '', // NotMapped
        missionApproveStatus: '', // NotMapped
        missionDateStatus: '', // NotMapped
        missionDeadLineStatus: '', // NotMapped
        missionFavouriteStatus: '', // NotMapped
        rating: 0 // Adjust as needed
      };
      

      // Log the payload for debugging
      console.log("Mission Payload:", missionPayload);

      this.service.AddMission(missionPayload).subscribe((data: any) => {
        if (data.result === 1) {
          this.toast.success({ detail: "SUCCESS", summary: data.data, duration: 3000 });
          setTimeout(() => {
            this.router.navigate(['admin/mission']);
          }, 1000);
        } else {
          this.toast.error({ detail: "ERROR", summary: data.message, duration: 3000 });
        }
      }, error => {
        console.error("Error adding mission:", error);
        this.toast.error({ detail: "ERROR", summary: "An error occurred", duration: 3000 });
      });

      this.formValid = false;
    }
  }




  OnCancel() {
    this.router.navigateByUrl('admin/mission');
  }

  OnRemoveImages(item: any) {
    const index: number = this.imageListArray.indexOf(item);
    if (item !== -1) {
      this.imageListArray.splice(index, 1);
    }
  }
}
