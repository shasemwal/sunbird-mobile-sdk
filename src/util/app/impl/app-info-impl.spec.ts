import {AppInfoImpl} from './app-info-impl';
import {SdkConfig} from '../../../sdk-config';
import {SharedPreferences} from '../../..';
import {of, throwError} from 'rxjs';
import {AppInfoKeys} from '../../../preference-keys';
import {CsModule} from '@project-sunbird/client-services';
import { App } from '@capacitor/app';

declare const sbutility;

describe('AppInfoImpl', () => {
    let appInfoImpl: AppInfoImpl;
    const mockSharedPreferences: Partial<SharedPreferences> = {};
    const mockSdkConfig: Partial<SdkConfig> = {
        apiConfig: {
            host: 'SAMPLE_HOST',
            user_authentication: {
                redirectUrl: 'SAMPLE_REDIRECT_URL',
                authUrl: 'SAMPLE_AUTH_URL',
                mergeUserHost: '',
                autoMergeApiPath: ''
            },
            api_authentication: {
                mobileAppKey: 'SAMPLE_MOBILE_APP_KEY',
                mobileAppSecret: 'SAMPLE_MOBILE_APP_SECRET',
                mobileAppConsumer: 'SAMPLE_MOBILE_APP_CONSTANT',
                channelId: 'SAMPLE_CHANNEL_ID',
                producerId: 'SAMPLE_PRODUCER_ID',
                producerUniqueId: 'SAMPLE_PRODUCER_UNIQUE_ID'
            },
            cached_requests: {
                timeToLive: 2 * 60 * 60 * 1000
            }
        },
        appConfig: {
            maxCompatibilityLevel: 10,
            minCompatibilityLevel: 1,
            deepLinkBasePath: '',
            buildConfigPackage: 'build_config_package'
        }
    };
    window['Capacitor'] = {
        Plugins: {
            App: {
                getInfo: jest.fn(() => Promise.resolve({name: 'SOME_APP_NAME'})) as any
            }
        }
    }
    beforeAll(() => {
        appInfoImpl = new AppInfoImpl(
            mockSdkConfig as SdkConfig,
            mockSharedPreferences as SharedPreferences
        );
    });

    beforeEach(() => {
        jest.spyOn(CsModule.instance, 'isInitialised', 'get').mockReturnValue(false);
        jest.clearAllMocks();
    });

    it('should create a instance of appInfoImpl', () => {
        expect(appInfoImpl).toBeTruthy();
    });

    it('should return app version name', () => {
        // arrange
        App.getInfo = jest.fn(() => Promise.resolve({name: 'SOME_APP_NAME'})) as any;
        // act
        appInfoImpl.getVersionName();
        // arrange
    });

    it('should return app version name', () => {
        // arrange
        App.getInfo = jest.fn(() => Promise.resolve({name: 'SOME_APP_NAME'})) as any;
        // act
        appInfoImpl.getAppName();
        // arrange
    });

    describe('init()', () => {
        beforeEach(() => {
            const mockSdkConfigApi: Partial<SdkConfig> = {
                platform: 'cordova',
                apiConfig: {
                    host: 'SAMPLE_HOST',
                    user_authentication: {
                        redirectUrl: 'SAMPLE_REDIRECT_URL',
                        authUrl: 'SAMPLE_AUTH_URL',
                        mergeUserHost: '',
                        autoMergeApiPath: ''
                    },
                    api_authentication: {
                        mobileAppKey: 'SAMPLE_MOBILE_APP_KEY',
                        mobileAppSecret: 'SAMPLE_MOBILE_APP_SECRET',
                        mobileAppConsumer: 'SAMPLE_MOBILE_APP_CONSTANT',
                        channelId: 'SAMPLE_CHANNEL_ID',
                        producerId: 'SAMPLE_PRODUCER_ID',
                        producerUniqueId: 'SAMPLE_PRODUCER_UNIQUE_ID'
                    },
                    cached_requests: {
                        timeToLive: 2 * 60 * 60 * 1000
                    }
                },
                appConfig: {
                    maxCompatibilityLevel: 10,
                    minCompatibilityLevel: 1,
                    deepLinkBasePath: '',
                    buildConfigPackage: 'build_config_package'
                }
            };
            appInfoImpl = new AppInfoImpl(
                mockSdkConfigApi as SdkConfig,
                mockSharedPreferences as SharedPreferences
            );
        });

        it('should update CsModule app version configuration', (done) => {
            // arrange
            window['sbutility'] = {
                getBuildConfigValue: (_, __, cb) => {
                    cb('SOME_APP_NAME');
                }
            } as any;
            mockSharedPreferences.getString = jest.fn().mockImplementation(() => of('first_access_timestamp'));
            jest.spyOn(CsModule.instance, 'isInitialised', 'get').mockReturnValue(true);
            jest.spyOn(CsModule.instance, 'config', 'get').mockReturnValue({
                core: {
                    httpAdapter: 'HttpClientCordovaAdapter',
                    global: {
                        channelId: 'channelId',
                        producerId: 'producerId',
                        deviceId: 'deviceId'
                    },
                    api: {
                        host: 'host',
                        authentication: {}
                    }
                },
                services: {}
            });
            jest.spyOn(CsModule.instance, 'updateConfig').mockReturnValue(undefined);
            // act
            appInfoImpl.init().then(() => {
                // assert
                expect(CsModule.instance.updateConfig).toHaveBeenCalledWith({
                    core: {
                        httpAdapter: 'HttpClientCordovaAdapter',
                        global: {
                            channelId: 'channelId',
                            producerId: 'producerId',
                            deviceId: 'deviceId',
                            appVersion: '6.0-local'
                        },
                        api: {
                            host: 'host',
                            authentication: {}
                        }
                    },
                    services: {}
                });
                done();
            });
        });
    });

    it('should get setFirstAccessTimestamp for debugmode is true', async () => {
        // arrange
        mockSharedPreferences.getString = jest.fn().mockImplementation(() => of('first_access_timestamp'));
        // act
        await appInfoImpl.init().then(() => {
            // assert
            expect(mockSharedPreferences.getString).toHaveBeenCalledWith(AppInfoKeys.KEY_FIRST_ACCESS_TIMESTAMP);
        });
    });

    it('should get setFirstAccessTimestamp if debugMode is false', async() => {
        // arrange
        mockSharedPreferences.getString = jest.fn().mockImplementation(() => of(undefined));
        mockSharedPreferences.putString = jest.fn().mockImplementation(() => of(undefined));
        const mockSdkConfigApi: Partial<SdkConfig> = {
            apiConfig: {
                host: 'SAMPLE_HOST',
                user_authentication: {
                    redirectUrl: 'SAMPLE_REDIRECT_URL',
                    authUrl: 'SAMPLE_AUTH_URL',
                    mergeUserHost: '',
                    autoMergeApiPath: ''
                },
                api_authentication: {
                    mobileAppKey: 'SAMPLE_MOBILE_APP_KEY',
                    mobileAppSecret: 'SAMPLE_MOBILE_APP_SECRET',
                    mobileAppConsumer: 'SAMPLE_MOBILE_APP_CONSTANT',
                    channelId: 'SAMPLE_CHANNEL_ID',
                    producerId: 'SAMPLE_PRODUCER_ID',
                    producerUniqueId: 'SAMPLE_PRODUCER_UNIQUE_ID'
                },
                cached_requests: {
                    timeToLive: 2 * 60 * 60 * 1000
                }
            },
            appConfig: {
                maxCompatibilityLevel: 10,
                minCompatibilityLevel: 1,
                deepLinkBasePath: '',
                buildConfigPackage: 'build_config_package'
            }
        };
        appInfoImpl = new AppInfoImpl(
            mockSdkConfigApi as SdkConfig,
            mockSharedPreferences as SharedPreferences
        );
        jest.spyOn(sbutility, 'getBuildConfigValue').mockReturnValue((a, b, c, d) => {
            setTimeout(() => {
                c('2.6.0'),
                d('buildConfig_error');
            });
        });
        // act
       await appInfoImpl.init().then(() => {
            // assert
            expect(mockSharedPreferences.getString).toHaveBeenCalledWith(AppInfoKeys.KEY_FIRST_ACCESS_TIMESTAMP);
            expect(mockSharedPreferences.putString).toHaveBeenCalledWith(AppInfoKeys.KEY_FIRST_ACCESS_TIMESTAMP, expect.any(String));
        });
    });

    it('should get FirstAccessTimestamp', (done) => {
        // arrange
        mockSharedPreferences.getString = jest.fn().mockImplementation(() => of('first_access_timestamp'));
        // act
        appInfoImpl.getFirstAccessTimestamp().subscribe(() => {
            // assert
            expect(mockSharedPreferences.getString).toHaveBeenCalledWith(AppInfoKeys.KEY_FIRST_ACCESS_TIMESTAMP);
            done();
        });
    });

    describe('getBuildConfigValue', () => {
        it('should resolve with the correct value', async () => {
            const mockGetBuildConfigValue = jest.fn((packageName, property, successCallback, errorCallback) => {
                successCallback('mockedValue');
            });
            sbutility.getBuildConfigValue = mockGetBuildConfigValue;
            // act
            const result = await appInfoImpl.getBuildConfigValue('packageName', 'property');
            // Expectations
            expect(mockGetBuildConfigValue).toHaveBeenCalledWith('packageName', 'property', expect.any(Function), expect.any(Function));
            expect(result).toBe('mockedValue');
        });
    
        it('should reject with an error', async () => {
            const mockGetBuildConfigValue = jest.fn((packageName, property, successCallback, errorCallback) => {
                // Simulate error callback
                errorCallback('mockedError');
            });
            sbutility.getBuildConfigValue = mockGetBuildConfigValue;
    
            // act
            try {
                await appInfoImpl.getBuildConfigValue('packageName', 'property');
                fail('Expected promise to reject, but it resolved');
            } catch (error) {
                expect(mockGetBuildConfigValue).toHaveBeenCalledWith('packageName', 'property', expect.any(Function), expect.any(Function));
                expect(error).toBe('mockedError');
            }
        });
    });
});

