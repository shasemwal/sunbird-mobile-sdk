import { GetFaqDetailsHandler } from './get-faq-details-handler';
import { ApiService, CachedItemStore } from '../..';
import { FaqServiceConfig, GetFaqRequest } from '..';
import { FileService } from '../../util/file/def/file-service';
import { of } from 'rxjs';
import { Device } from '@capacitor/device';

jest.mock('@capacitor/device', () => {
    return {
      ...jest.requireActual('@capacitor/device'),
        Device: {
            getInfo: jest.fn()
        }
    }
})
describe('GetFaqDetailsHandler', () => {
    let getFaqDetailsHandler: GetFaqDetailsHandler;
    const mockApiService: Partial<ApiService> = {};
    const mockFaqServiceConfig: Partial<FaqServiceConfig> = {};
    const mockFileservice: Partial<FileService> = {};
    const mockCachedItemStore: Partial<CachedItemStore> = {};

    beforeAll(() => {
        getFaqDetailsHandler = new GetFaqDetailsHandler(
            mockApiService as ApiService,
            mockFaqServiceConfig as FaqServiceConfig,
            mockFileservice as FileService,
            mockCachedItemStore as CachedItemStore
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be create a instance of getFaqDetailsHandler', () => {
        expect(getFaqDetailsHandler).toBeTruthy();
    });

    it('should fetch data from server', (done) => {
        // arrange
        const request: GetFaqRequest = {
            language: 'english',
            faqUrl: 'http://faq/url'
        };
        mockCachedItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => d());
        const data = mockApiService.fetch =  jest.fn().mockImplementation(() => of({
            body: {
                result: {
                    response: 'SAMPLE_RESPONSE'
                },
                trim: jest.fn().mockImplementation(() => '{"name": "s-name"}')
            }
        }));

        // act
        getFaqDetailsHandler.handle(request).subscribe(() => {
            // assert
            expect(mockCachedItemStore.getCached).toHaveBeenCalled();
            done();
        });
    });

    it('should fetch data from file', (done) => {
        // arrange
        Device.getInfo = jest.fn(() => Promise.resolve({ uuid: 'some_uuid', platform:'android' }) as any);
        const request: GetFaqRequest = {
            language: 'english',
            faqUrl: 'http://faq/url'
        };
        mockCachedItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => e());
        mockFileservice.readFileFromAssets = jest.fn().mockImplementation(() => Promise.resolve('{"uid": "sample-uid"}'));
        // act
        getFaqDetailsHandler.handle(request).subscribe(() => {
            // assert
            expect(mockCachedItemStore.getCached).toHaveBeenCalled();
            expect(mockFileservice.readFileFromAssets).toHaveBeenCalled();
            done();
        });
    });

    it('should handle error on fetch data from server', (done) => {
        // arrange
        const request: GetFaqRequest = {
            language: 'english',
            faqUrl: 'http://faq/url'
        };
        mockCachedItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => d());
        const data = mockApiService.fetch =  jest.fn().mockImplementation(() => of({
            body: {
                error: {
                    response: 'SAMPLE_RESPONSE'
                },
            }
        }));

        // act
        getFaqDetailsHandler.handle(request).subscribe(() => {
            // assert
            expect(mockCachedItemStore.getCached).toHaveBeenCalled();
            done();
        });
    });
});
