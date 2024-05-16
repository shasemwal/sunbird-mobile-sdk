import {CachedItemStore} from '../../key-value-store';
import {FileService} from '../../util/file/def/file-service';
import {Channel, ChannelDetailsRequest, FrameworkServiceConfig, Framework} from '..';
import {ApiService} from '../../api';
import {of} from 'rxjs';
import { GetChannelDetailsHandler } from './get-channel-detail-handler';
import { Device } from '@capacitor/device';

jest.mock('@capacitor/device', () => {
    return {
      ...jest.requireActual('@capacitor/device'),
        Device: {
            getInfo: jest.fn()
        }
    }
})


describe('GetChannelDetailHandler', () => {

    let getChannelDetailHandler: GetChannelDetailsHandler;
    const mockApiService: Partial<ApiService> = {};
    const mockFileService: Partial<FileService> = {};
    const mockCacheItemStore: Partial<CachedItemStore> = {};
    const mockFrameworkServiceConfig: Partial<FrameworkServiceConfig> = {};
    beforeAll(() => {
        getChannelDetailHandler = new GetChannelDetailsHandler(
            mockApiService as ApiService,
            mockFrameworkServiceConfig as FrameworkServiceConfig,
            mockFileService as FileService,
            mockCacheItemStore as CachedItemStore
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an instance of GetChannelDetailHandler', () => {
        expect(getChannelDetailHandler).toBeTruthy();
    });

    it('should run handle function from the GetChannelDetailHandler', (done) => {
        // arrange
        const request: ChannelDetailsRequest = {
            channelId: 'SAMPLE_CHANNEL_ID'
        };
        const sampleframeworks:  Framework[] = [{
            name: 'SOME_NAME_1',
            identifier: 'SOME_IDENTIFIER'
        }, {
            name: 'SOME_NAME_2',
            identifier: 'SOME_IDENTIFIER'
        }];
        const channels: Channel = {
            identifier: 'SOME_IDENTIFIER',
            code: 'SOME_CODE',
            consumerId: 'SOME_CONSUMER_ID',
            channel: 'SOME_CHANNEL',
            description: 'SOME_DESCRIPTION',
            createdOn: 'SOME_CREATED_ON',
            versionKey: 'SOME_VERSION_KEY',
            appId: 'SOME_APP_ID',
            name: 'SOME_NAME',
            lastUpdatedOn: 'LAST_UPDATED',
            defaultFramework: 'SOME_DEFAULT_FRAMEWORK',
            status: 'SOME_STATUS',
            frameworks : sampleframeworks
        };
        mockCacheItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => d());
        mockApiService.fetch = jest.fn().mockImplementation(() => of({ body: {result: {channel: channels}}}));
        // act
       // expect(channel.frameworks[0].name).toBe('SOME_NAME');
        getChannelDetailHandler.handle(request).subscribe(() => {
            expect(mockCacheItemStore.getCached).toHaveBeenCalled();
            expect(mockApiService.fetch).toHaveBeenCalled();
            done();
        });
    });

    it('should return an instance of GetChannelDetailHandler', () => {
        expect(getChannelDetailHandler).toBeTruthy();
    });

    it('should run handle function from the GetChannelDetailHandler if framework not available', (done) => {
        // arrange
        const request: ChannelDetailsRequest = {
            channelId: 'SAMPLE_CHANNEL_ID'
        };
        const channels: Channel = {
            identifier: 'SOME_IDENTIFIER',
            code: 'SOME_CODE',
            consumerId: 'SOME_CONSUMER_ID',
            channel: 'SOME_CHANNEL',
            description: 'SOME_DESCRIPTION',
            createdOn: 'SOME_CREATED_ON',
            versionKey: 'SOME_VERSION_KEY',
            appId: 'SOME_APP_ID',
            name: 'SOME_NAME',
            lastUpdatedOn: 'LAST_UPDATED',
            defaultFramework: 'SOME_DEFAULT_FRAMEWORK',
            status: 'SOME_STATUS',
            frameworks : undefined
        };
        mockCacheItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => d());
        mockApiService.fetch = jest.fn().mockImplementation(() => of({ body: {result: {channel: channels}}}));
        // act
       // expect(channel.frameworks[0].name).toBe('SOME_NAME');
        getChannelDetailHandler.handle(request).subscribe(() => {
            expect(mockCacheItemStore.getCached).toHaveBeenCalled();
            expect(mockApiService.fetch).toHaveBeenCalled();
            done();
        });
    });

    it('should run handle function from the GetChannelDetailHandler', () => {
        // arrange
        Device.getInfo = jest.fn(() => Promise.resolve({ uuid: 'some_uuid', platform:'android' })) as any;
        const request: ChannelDetailsRequest = {
            channelId: 'SAMPLE_CHANNEL_ID'
        };
        const sampleframeworks:  Framework = {
            name: 'SOME_NAME',
            identifier: 'SOME_IDENTIFIER'
        };
        const channel: Channel = {
            identifier: 'SOME_IDENTIFIER',
            code: 'SOME_CODE',
            consumerId: 'SOME_CONSUMER_ID',
            channel: 'SOME_CHANNEL',
            description: 'SOME_DESCRIPTION',
            createdOn: 'SOME_CREATED_ON',
            versionKey: 'SOME_VERSION_KEY',
            appId: 'SOME_APP_ID',
            name: 'SOME_NAME',
            lastUpdatedOn: 'LAST_UPDATED',
            defaultFramework: 'SOME_DEFAULT_FRAMEWORK',
            status: 'SOME_STATUS',
            frameworks : [sampleframeworks]
        };
        mockCacheItemStore.getCached = jest.fn().mockImplementation((a, b, c, d, e) => e());
        mockFileService.readFileFromAssets = jest.fn(() => of(JSON.stringify({
            result: {result: {channel: ''}}
        }))) as any;
        // act
        getChannelDetailHandler.handle(request).subscribe(() => {
            expect(mockCacheItemStore.getCached).toHaveBeenCalled();
            expect(mockFileService.readFileFromAssets).toHaveBeenCalled();

        });
    });
});

