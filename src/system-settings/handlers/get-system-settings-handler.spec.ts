import {GetSystemSettingsHandler} from './get-system-settings-handler';
import {ApiService} from '../../api';
import {mockSdkConfigWithSystemSettingsConfig} from '../impl/system-settings-service-impl.spec.data';
import {GetSystemSettingsRequest, SystemSettings, SystemSettingsConfig} from '..';
import {FileService} from '../../util/file/def/file-service';
import {CachedItemStore} from '../../key-value-store';
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
describe('GetSystemSettingsHandler', () => {
    let getSystemSettingsHandler: GetSystemSettingsHandler;

    const mockApiService: Partial<ApiService> = {};
    const mockFileService: Partial<FileService> = {};
    const mockCachedItemStore: Partial<CachedItemStore> = {};

    beforeAll(() => {
        getSystemSettingsHandler = new GetSystemSettingsHandler(
            mockApiService as ApiService,
            mockSdkConfigWithSystemSettingsConfig as SystemSettingsConfig,
            mockFileService as FileService,
            mockCachedItemStore as CachedItemStore
        );
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create instance of GetSystemSettingsHandler', () => {
        expect(getSystemSettingsHandler).toBeTruthy();
    });

    it('should handle cachedItem when called with api', (done) => {
        // arrange
        const request: GetSystemSettingsRequest = {
            id: 'sample_id'
        };
        const response: SystemSettings = {
            id: 'sample_id',
            field: 'sample_field',
            value: 'sample_value'
        };
        mockCachedItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => d());
        mockApiService.fetch = jest.fn().mockImplementation(() => of({
            body: {
                result: {
                    response: response
                }
            }
        }));
        // act
        getSystemSettingsHandler.handle(request).subscribe(() => {
            // assert
            expect(mockCachedItemStore.getCached).toHaveBeenCalled();
            expect(mockApiService.fetch).toHaveBeenCalled();
            done();
        });
    });
    it('should handle cachedItem when called with fileService', () => {
        // arrange
        Device.getInfo = jest.fn(() => Promise.resolve({ uuid: 'some_uuid', platform:'android' }) as any);
        const request: GetSystemSettingsRequest = {
            id: 'sample_id'
        };
        mockCachedItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => e());
        mockFileService.readFileFromAssets = jest.fn().mockImplementation((result) => of('{"result":{"result":{"response":""}}}'));
        // act
        getSystemSettingsHandler.handle(request).subscribe(() => {
            // assert
            expect(mockCachedItemStore.getCached).toHaveBeenCalled();
            expect(mockFileService.readFileFromAssets).toHaveBeenCalled();
        });
    });
});
