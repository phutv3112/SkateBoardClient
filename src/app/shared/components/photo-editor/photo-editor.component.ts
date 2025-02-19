import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FileUploader, FileUploadModule } from 'ng2-file-upload';
import { environment } from '../../../../environments/environment';
import { Photo } from '../../models/photo';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-photo-editor',
  standalone: true,
  imports: [CommonModule, FileUploadModule, DecimalPipe],
  templateUrl: './photo-editor.component.html',
  styleUrl: './photo-editor.component.scss',
})
export class PhotoEditorComponent implements OnInit {
  @Input() productId: string = '';
  uploader: FileUploader;
  hasBaseDropZoneOver: boolean;
  hasAnotherDropZoneOver: boolean;
  baseUrl = environment.apiUrl;

  selectedFiles: File[] = [];
  selectedFileNames: string[] = [];

  constructor(private cdr: ChangeDetectorRef) {
    this.uploader = new FileUploader({
      url: this.baseUrl + 'products/add-photo/' + this.productId,
      isHTML5: true,
      allowedFileType: ['image'],
      removeAfterUpload: true,
      autoUpload: false,
      maxFileSize: 10 * 1024 * 1024,
    });
    this.hasBaseDropZoneOver = false;
    this.hasAnotherDropZoneOver = false;
  }
  ngOnInit(): void {
    this.initializeUploader();
  }

  // onFileSelected(event: any) {
  //   this.selectedFiles = Array.from(event.target.files);
  // }
  // onFileSelected(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files) {
  //     this.selectedFileNames = Array.from(input.files).map((file) => file.name);
  //   }
  // }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFileNames = Array.from(input.files).map((file) => file.name);
    }

    //this.cdr.detectChanges();
  }

  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileOverAnother(e: any): void {
    this.hasAnotherDropZoneOver = e;
  }

  // setMainPhoto(photo: Photo) {
  //   this.memberService.setMainPhoto(photo.id).subscribe(() => {
  //     this.user.photoUrl = photo.url;
  //     this.accountService.setCurrentUser(this.user);
  //     this.member.photoUrl = photo.url;
  //     this.member.photos.forEach(p => {
  //       if (p.isMain) p.isMain = false;
  //       if (p.id === photo.id) p.isMain = true;
  //     })
  //   })
  // }

  // deletePhoto(photoId: number) {
  //   this.memberService.deletePhoto(photoId).subscribe(() => {
  //     this.member.photos = this.member.photos.filter(x => x.id !== photoId);
  //   })
  // }

  initializeUploader() {
    this.uploader = new FileUploader({
      url: this.baseUrl + 'products/add-photo/' + this.productId,
      isHTML5: true,
      allowedFileType: ['image'],
      removeAfterUpload: true,
      autoUpload: false,
      maxFileSize: 10 * 1024 * 1024,
    });

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploader.onSuccessItem = (item, response, status, headers) => {
      if (response) {
        const photo: Photo = JSON.parse(response);
        // this.member.photos.push(photo);
        //  if (photo.isMain) {
        //    this.user.photoUrl = photo.url;
        //    this.member.photoUrl = photo.url;
        //    this.accountService.setCurrentUser(this.user);
        //  }
      }
    };
  }
}
