import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { By } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import {
  AppStateService,
  createTranslateLoader,
  PortalMessageService,
  UserService
} from '@onecx/portal-integration-angular'
import { of, throwError } from 'rxjs'
import { ImageDataResponse, ImageInfo, ImagesInternalAPIService } from 'src/app/shared/generated'
import { WelcomeOverviewComponent } from './welcome-overview.component'
describe('WelcomeOverviewComponent', () => {
  let component: WelcomeOverviewComponent
  let fixture: ComponentFixture<WelcomeOverviewComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', [
    'success',
    'error',
    'info',
    'warning'
  ])

  const apiServiceSpy = {
    getAllImageInfosByWorkspaceName: jasmine.createSpy('getAllImageInfosByWorkspaceName').and.returnValue(of({})),
    getImageById: jasmine.createSpy('getImageById').and.returnValue(of({}))
  }

  const mockUserService = {
    lang$: {
      getValue: jasmine.createSpy('getValue')
    },
    profile$: {
      getValue: jasmine.createSpy('getValue'),
      asObservable: jasmine.createSpy('asObservable')
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [WelcomeOverviewComponent],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient, AppStateService]
          }
        }),
        BrowserAnimationsModule
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ImagesInternalAPIService, useValue: apiServiceSpy },
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    msgServiceSpy.warning.calls.reset()
    apiServiceSpy.getAllImageInfosByWorkspaceName.calls.reset()
    apiServiceSpy.getImageById.calls.reset()
    mockUserService.lang$.getValue.and.returnValue('de')
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeOverviewComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })
  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should get all imageinfos onInit', () => {
    apiServiceSpy.getAllImageInfosByWorkspaceName.and.returnValue(
      of([
        { id: '123', imageId: '123', visible: true, position: '1', workspaceName: 'w1' },
        { id: '1234', imageId: '1234', visible: true, position: '2', workspaceName: 'w1' },
        { id: '12345', imageId: '12345', visible: true, position: '4', workspaceName: 'w1' },
        { id: '123456', imageId: '123456', visible: true, position: '3', workspaceName: 'w1' },
        { id: '123', url: 'http://onecx.de', visible: true, position: '1', workspaceName: 'w1' }
      ])
    )
    apiServiceSpy.getImageById.and.returnValues(
      of({ imageId: '123', imageData: new Blob() } as ImageDataResponse),
      of({ imageId: '1234', imageData: new Blob() } as ImageDataResponse),
      of({ imageId: '12345', imageData: new Blob() } as ImageDataResponse),
      of({ imageId: '123456', imageData: new Blob() } as ImageDataResponse)
    )
    component.imageInfos = []

    component.ngOnInit()

    expect(component.imageInfos).toContain({
      id: '123',
      url: 'http://onecx.de',
      visible: true,
      position: '1',
      workspaceName: 'w1'
    })
  })

  it('should handle error when fetching imageData', () => {
    apiServiceSpy.getImageById.and.returnValue(throwError(() => new Error()))
    component.imageInfos = [{ id: '123', imageId: '123', visible: true, position: '1', workspaceName: 'w1' }]
    component.fetchImageData()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'GENERAL.IMAGES.NOT_FOUND' })
  })

  it('should display image in carousel', () => {
    const imageInfos = [
      { id: '123', url: 'http://onecx.de', visible: true, position: '1' } as ImageInfo,
      { id: '1234', imageId: '1234', visible: true, position: '1' } as ImageInfo
    ]
    apiServiceSpy.getAllImageInfosByWorkspaceName.and.returnValue(of(imageInfos))
    apiServiceSpy.getImageById.and.returnValues(of({ imageId: '1234', imageData: new Blob() } as ImageDataResponse))
    component.imageInfos = []
    component.currentSlide = 0
    component.ngOnInit()
    fixture.detectChanges()
    const dElement = fixture.debugElement
    let slide = dElement.query(By.css('.slide'))
    expect(slide).toBeTruthy()
    component.currentSlide = 1
    fixture.detectChanges()
    slide = dElement.query(By.css('.slide'))
    expect(slide).toBeTruthy()
  })
})
