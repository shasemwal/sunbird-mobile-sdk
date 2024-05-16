import {GetFormHandler} from './get-form-handler';
import {ApiService} from '../../api';
import {FileService} from '../../util/file/def/file-service';
import {CachedItemRequestSourceFrom, CachedItemStore} from '../../key-value-store';
import {mockSdkConfigWithFormServiceConfig} from '../impl/form-service-impl.spec.data';
import {FormRequest, FormServiceConfig} from '..';
import {of} from 'rxjs';
import { Device } from '@capacitor/device';

jest.mock('@capacitor/device', () => {
    return {
      ...jest.requireActual('@capacitor/device'),
        Device: {
            getInfo: jest.fn()
        }
    }
})
describe('GetFormHandler', () => {
    let getFormHandler: GetFormHandler;

    const mockApiService: Partial<ApiService> = {};
    const mockFileService: Partial<FileService> = {};
    const mockCachedItemStore: Partial<CachedItemStore> = {};

    beforeAll(() => {
        getFormHandler = new GetFormHandler(
            mockApiService as ApiService,
            mockSdkConfigWithFormServiceConfig as FormServiceConfig,
            mockFileService as FileService,
            mockCachedItemStore as CachedItemStore
        );
    });

    beforeEach(() => {
        Device.getInfo = jest.fn(() => Promise.resolve({platform: 'android'})) as any
        jest.clearAllMocks();
    });

    it('should create instance of getFormHandler', () => {
        expect(getFormHandler).toBeTruthy();
    });

    it('should handle cachedItem when called with API', (done) => {
        // arrange
        const request: FormRequest = {
            type: 'sample_type',
            subType: 'sample_subType',
            action: 'sample_action',
            rootOrgId: 'sample_rootOrgId',
            framework: 'sample_framework'
        };
        mockCachedItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => d());
        mockApiService.fetch = jest.fn().mockImplementation(() => of({
            body: {
                result: 'sample_result'
            }
        }));
        // act
        getFormHandler.handle(request).subscribe(() => {
            // assert
            expect(mockCachedItemStore.getCached).toHaveBeenCalled();
            expect(mockApiService.fetch).toHaveBeenCalled();
            done();
        });
    });

    it('should handle cachedItem when called with fileService', () => {
        // arrange
        window['device'] = { uuid: 'some_uuid', platform:'android' };
        const request: FormRequest = {
            type: 'sample_type',
            subType: 'sample_subType',
            action: 'sample_action',
            rootOrgId: 'sample_rootOrgId',
            framework: 'sample_framework'
        };
        mockCachedItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => e());
        mockFileService.readFileFromAssets = jest.fn().mockImplementation((res) => of(JSON.stringify({
            result: {form: ''}
        })));
        // act
        getFormHandler.handle(request).subscribe(() => {
            // assert
            expect(mockCachedItemStore.getCached).toHaveBeenCalled();
            expect(mockFileService.readFileFromAssets).toHaveBeenCalled();
        });
    });

    it('should handle cachedItem from server if not available', (done) => {
        // arrange
        const request: FormRequest = {
            from: CachedItemRequestSourceFrom.SERVER,
            type: 'sample_type',
            subType: 'sample_subType',
            action: 'sample_action',
            rootOrgId: 'sample_rootOrgId',
            framework: 'sample_framework',
            component:'sample_comp'
        };
        mockCachedItemStore.getCached = jest.fn().mockImplementation(() => of({
            body: {
                result: 'sample'
            }
        }));

        mockCachedItemStore.get = jest.fn().mockImplementation(() => of({
            body: {
                result: 'sample'
            }
        }));
        // act
        getFormHandler.handle(request).subscribe(() => {
            expect(mockCachedItemStore.get).toHaveBeenCalled();
            done();
        });
    });
});
