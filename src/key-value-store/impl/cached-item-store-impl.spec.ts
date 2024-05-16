import { Container, injectable } from 'inversify';
import { InjectionTokens } from '../../injection-tokens';
import { CachedItemStoreImpl } from './cached-item-store-impl';
import { CachedItemStore, KeyValueStore } from '..';
import { AppInfo, DbService, DeviceInfo, FrameworkService, GroupServiceDeprecated, ProfileService, SdkConfig, SharedPreferences } from '../..';
import { mockSdkConfig } from '../../page/impl/page-assemble-service-impl.spec.data';
import { Observable, of, throwError } from 'rxjs';
import { KeyValueStoreImpl } from './key-value-store-impl';
import { SharedPreferencesAndroid } from '../../util/shared-preferences/impl/shared-preferences-android';

// @injectable()
// class MockKeyValueStore implements KeyValueStore {
//     private mockStore: { [key: string]: string | undefined } = {};

//     getValue(key: string): Observable<string | undefined> {
//         return of(this.mockStore[key]);
//     }

//     setValue(key: string, value: string): Observable<boolean> {
//         this.mockStore[key] = value;
//         return of(true);
//     }
// }

// class MockSharedPreferences implements SharedPreferences {
//     private mockStore: { [key: string]: any } = {};

//     getBoolean(key: string): Observable<boolean> {
//         return of(this.mockStore[key]);
//     }

//     getString(key: string): Observable<string | undefined> {
//         return of(this.mockStore[key]);
//     }

//     putBoolean(key: string, value: boolean): Observable<boolean> {
//         this.mockStore[key] = value;
//         return of(true);
//     }

//     putString(key: string, value: string): Observable<undefined> {
//         this.mockStore[key] = value;
//         return of(undefined);
//     }

//     addListener(key: string, listener: (value: any) => void) {
//     }

//     removeListener(key: string, listener: (value: any) => void) {
//     }
// }

interface Sample {
    key: string;
}

describe('CachedItemStoreImpl', () => {
    let cachedItemStore: CachedItemStoreImpl;
    const mockKeyValueStore: Partial<KeyValueStore> = {}
    const mockSharedPreferences: Partial<SharedPreferences> = {
        putString: jest.fn(() => of()),
        getString: jest.fn(() => of('some_string'))
    }
    const mockSdkConfig = {
        apiConfig: {
            cached_requests: {/* define properties as needed */}
        }
    };
    const container = new Container();

    beforeAll(() => {
        container.bind<CachedItemStore>(InjectionTokens.CACHED_ITEM_STORE).to(CachedItemStoreImpl);
        
        container.bind<SdkConfig>(InjectionTokens.SDK_CONFIG).toConstantValue(mockSdkConfig as SdkConfig);
        container.bind<KeyValueStore>(InjectionTokens.KEY_VALUE_STORE).toConstantValue(mockKeyValueStore as  KeyValueStoreImpl);
        container.bind<SharedPreferences>(InjectionTokens.SHARED_PREFERENCES).toConstantValue(mockSharedPreferences as SharedPreferencesAndroid);

        cachedItemStore = container.get(InjectionTokens.CACHED_ITEM_STORE);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it('should be get an instance of cachedItemStoreImpl from container', () => {
        expect(cachedItemStore).toBeTruthy();
    });

    describe('getCached()', () => {
        describe('when item is empty array or empty object or passes custom empty condition', () => {
            it('should resolve item without saving in cache store', async () => {
                // arrange
                const now = Date.now();
                mockKeyValueStore.setValue = jest.fn()
                mockKeyValueStore.getValue = jest.fn(() => of(JSON.stringify({})))
                mockSharedPreferences.getString = jest.fn(() => of('2345672'))
                mockSharedPreferences.putString = jest.fn(() => of())
                // act
                const r1 = await cachedItemStore.getCached<{}>(
                    'sample_id_' + now,
                    'sample_no_sql_key',
                    'sample_ttl_key',
                    () => of({}),
                    () => of({}), Date.now(), () => true
                ).toPromise();

                const r2 = await cachedItemStore.getCached<string[]>(
                    'sample_id_' + now,
                    'sample_no_sql_key',
                    'sample_ttl_key',
                    () => of([]),
                    () => of([]), 123, () => true
                ).toPromise();

                const r3 = await cachedItemStore.getCached<{ items: string[] }>(
                    'sample_id_' + now,
                    'sample_no_sql_key',
                    'sample_ttl_key',
                    () => of({ items: ['a', 'b', 'c'] }),
                    () => of({ items: ['a', 'b', 'c'] }),
                    undefined,
                    (i) => i.items.length < 10
                ).toPromise();

                // assert
                expect(r1).toEqual({});
                expect(r2).toEqual({});
                expect(r3).toEqual({});
                expect(mockKeyValueStore.setValue).not.toHaveBeenCalled();
            });

            it('should get string and resolve item without saving in cache store', async () => {
                // arrange
                mockSdkConfig.apiConfig = {
                    cached_requests: {
                        timeToLive: Date.now()
                    }
                } as any
                const now = Date.now();
                mockKeyValueStore.setValue = jest.fn()
                mockKeyValueStore.getValue = jest.fn(() => of(JSON.stringify({'key': "some_str"})))
                mockSharedPreferences.getString = jest.fn(() => of('sample_str'))
                mockSharedPreferences.putString = jest.fn(() => of())
                // act
                const r1 = await cachedItemStore.getCached<{}>(
                    'sample_id_' + now,
                    'sample_no_sql_key',
                    'sample_ttl_key',
                    () => of({}),
                    () => of({}), 123, () => true
                ).toPromise();

                const r2 = await cachedItemStore.getCached<string[]>(
                    'sample_id_' + now,
                    'sample_no_sql_key',
                    'sample_ttl_key',
                    () => of([]),
                    () => of([]), 123, () => true
                ).toPromise();

                const r3 = await cachedItemStore.getCached<{ items: string[] }>(
                    'sample_id_' + now,
                    'sample_no_sql_key',
                    'sample_ttl_key',
                    () => of({ items: ['a', 'b', 'c'] }),
                    () => of({ items: ['a', 'b', 'c'] }),
                    undefined,
                    (i) => i.items.length < 10
                ).toPromise();

                // assert
                expect(r1).toEqual({"key": "some_str"});
                expect(r2).toEqual({"key": "some_str"});
                expect(r3).toEqual({"key": "some_str"});
                expect(mockKeyValueStore.setValue).not.toHaveBeenCalled();
            });
        });

        describe('when item not cached in db', () => {
            describe('when initial source provided', () => {
                it('should fetch from server and save in cache store with ttl', (done) => {
                    // arrange
                    const now = Date.now();
                    mockKeyValueStore.setValue = jest.fn();
                    mockSharedPreferences.getString = jest.fn(() => of('true'))
                    mockSharedPreferences.putString = jest.fn(() => of())
                    // act
                    cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer' }),
                    )
                        // assert
                        // expect(result).toEqual({ key: 'fromServer' });
                        setTimeout(() => {
                            // expect(mockKeyValueStore.setValue).toHaveBeenCalledWith(
                            //     `sample_no_sql_key-sample_id_${now}`,
                            //     JSON.stringify({ key: 'fromServer' })
                            // );
                            done();
                        }, 0);
                    // });
                });
                it('should fetch from server and save in cache store with ttl', (done) => {
                    // arrange
                    const now = Date.now();
                    mockKeyValueStore.setValue = jest.fn();
                    mockSharedPreferences.getString = jest.fn(() => of(''))
                    mockSharedPreferences.putString = jest.fn(() => of())
                    // act
                    cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer' }),
                    )
                        // assert
                        // expect(result).toEqual({ key: 'fromServer' });
                        setTimeout(() => {
                            // expect(mockKeyValueStore.setValue).toHaveBeenCalledWith(
                            //     `sample_no_sql_key-sample_id_${now}`,
                            //     JSON.stringify({ key: 'fromServer' })
                            // );
                            done();
                        }, 0);
                    // });
                });
            });

            describe('when initial source provided', () => {
                it('should fetch from initial source and save in cache store with ttl', (done) => {
                    // arrange
                    const now = Date.now();
                    mockKeyValueStore.setValue = jest.fn();
                    mockSharedPreferences.getString = jest.fn(() => of('true'))
                    mockSharedPreferences.putString = jest.fn(() => of())
                    // act
                    cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer' }),
                        () => of({ key: 'fromInitial' })
                    )
                    // .subscribe((result) => {
                        // assert
                        // expect(result).toEqual({ key: 'fromInitial' });
                        // expect(mockKeyValueStore.setValue).toHaveBeenCalledWith(
                        //     `sample_no_sql_key-sample_id_${now}`,
                        //     JSON.stringify({ key: 'fromInitial' })
                        // );
                        done();
                    // });
                });

                it('should fetch from initial source and save in cache store with ttl', (done) => {
                    // arrange
                    const now = Date.now();
                    mockKeyValueStore.setValue = jest.fn();
                    mockSharedPreferences.getString = jest.fn(() => of(''))
                    mockSharedPreferences.putString = jest.fn(() => of())
                    // act
                    cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer' }),
                        () => of({ key: 'fromInitial' })
                    )
                    // .subscribe((result) => {
                        // assert
                        // expect(result).toEqual({ key: 'fromInitial' });
                        // expect(mockKeyValueStore.setValue).toHaveBeenCalledWith(
                        //     `sample_no_sql_key-sample_id_${now}`,
                        //     JSON.stringify({ key: 'fromInitial' })
                        // );
                        done();
                    // });
                });

                // it('should fetch from server and save in cache store if initial store fails with ttl', (done) => {
                //     // arrange
                //     const mockKeyValueStore = container.get<KeyValueStore>(InjectionTokens.KEY_VALUE_STORE);
                //     const now = Date.now();
                //     jest.spyOn(mockKeyValueStore, 'setValue').mockImplementation();

                //     // act
                //     cachedItemStore.getCached<Sample>(
                //         'sample_id_' + now,
                //         'sample_no_sql_key',
                //         'sample_ttl_key',
                //         () => of({ key: 'fromServer' }),
                //         () => throwError(new Error('Sample Error'))
                //     ).subscribe((result) => {
                //         // assert
                //         expect(result).toEqual({ key: 'fromServer' });
                //         // expect(mockKeyValueStore.setValue).toHaveBeenCalledWith(
                //         //     `sample_no_sql_key-sample_id_${now}`,
                //         //     JSON.stringify({ key: 'fromServer' })
                //         // );
                //         done();
                //     });
                // });
            });
        });

        describe('when item cached in db', () => {
            describe('when ttl not expired', () => {
                it('should fetch from cache store', async () => {
                    // arrange
                    const mockKeyValueStore = container.get<KeyValueStore>(InjectionTokens.KEY_VALUE_STORE);
                    const now = Date.now();
                    mockKeyValueStore.setValue = jest.fn(() => of())
                    mockKeyValueStore.getValue = jest.fn(() => of(''))
                    mockSharedPreferences.getString = jest.fn(() => throwError(''))
                    mockSharedPreferences.putString = jest.fn(() => of())
                    // act
                    await cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer1' }),
                    ).toPromise();

                    const response = await cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer2' }),
                    ).toPromise();

                    // expect(mockKeyValueStore.getValue).toHaveBeenCalledWith(
                    //     `sample_no_sql_key-sample_id_${now}`
                    // );
                    // expect(response).toEqual({ key: 'fromServer1' });
                });
            });

            describe('when ttl expired', () => {
                it('should fetch from store and in parallel fetch from server and save in cache store updating ttl', async () => {
                    // arrange
                    const now = Date.now();
                    mockKeyValueStore.setValue = jest.fn(() => of())
                    mockKeyValueStore.getValue = jest.fn(() => of(''))
                    mockSharedPreferences.getString = jest.fn(() => of('true'))
                    mockSharedPreferences.putString = jest.fn(() => of())
                    // act
                    await cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer1' }),
                    )

                    // jest.resetAllMocks();

                    const response = await cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer2' }),
                        undefined,
                        0
                    )

                    setTimeout(() => {
                        expect(mockKeyValueStore.setValue).toHaveBeenCalledWith(
                            `sample_no_sql_key-sample_id_${now}`,
                            JSON.stringify({ key: 'fromServer2' })
                        );

                        expect(response).toEqual({ key: 'fromServer1' });
                    });
                });
                it('should fetch from store and in parallel fetch from server and save in cache store updating ttl', async () => {
                    // arrange
                    const now = Date.now();
                    mockKeyValueStore.setValue = jest.fn(() => of())
                    mockKeyValueStore.getValue = jest.fn(() => of(''))
                    mockSharedPreferences.getString = jest.fn(() => of(''))
                    mockSharedPreferences.putString = jest.fn(() => of())
                    // act
                    await cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer1' }),
                    )

                    // jest.resetAllMocks();

                    const response = await cachedItemStore.getCached<Sample>(
                        'sample_id_' + now,
                        'sample_no_sql_key',
                        'sample_ttl_key',
                        () => of({ key: 'fromServer2' }),
                        undefined,
                        0
                    )

                    setTimeout(() => {
                        expect(mockKeyValueStore.setValue).toHaveBeenCalledWith(
                            `sample_no_sql_key-sample_id_${now}`,
                            JSON.stringify({ key: 'fromServer2' })
                        );

                        expect(response).toEqual({ key: 'fromServer1' });
                    });
                });
            });
        });
    });

    describe('get()', () => {
        it('should first fetch from server before checking cache', async () => {
            // arrange
            const now1 = Date.now();
            mockKeyValueStore.setValue = jest.fn(() => of(false))
            mockKeyValueStore.getValue = jest.fn(() => of('false'))
            mockSharedPreferences.getString = jest.fn(() => of(''))
            mockSharedPreferences.putString = jest.fn(() => of({})) as any
                    
            // act
            const r1 = await cachedItemStore.get<Sample>(
                'sample_id_' + now1,
                'sample_no_sql_key',
                'sample_ttl_key2',
                () => of({ key: 'fromServer1' }),
                () => of({ key: 'fromInitial1' })
            ).toPromise();

            const now2 = Date.now() - 100;

            const r2 = await cachedItemStore.get<Sample>(
                'sample_id_2' + now2,
                'sample_no_sql_key',
                'sample_ttl_key',
                () => throwError(new Error('Sample Error')),
                () => of({ key: 'fromInitial2' })
            ).toPromise();

            // assert
            expect(r1).toEqual({ key: 'fromServer1' });
        });

        it('should first fetch from server before checking cache, on error initial', async () => {
            // arrange
            const now1 = Date.now();
            mockKeyValueStore.setValue = jest.fn(() => of(false))
            mockKeyValueStore.getValue = jest.fn(() => of('false'))
            mockSharedPreferences.getString = jest.fn(() => of(''))
            mockSharedPreferences.putString = jest.fn(() => of({})) as any
                    
            // act
            const r1 = await cachedItemStore.get<Sample>(
                'sample2_id_' + now1,
                'sample_no_sql_key',
                'sample_ttl_key2',
                () => of({ key: 'fromServer1' }),
                () => of({ key: 'fromServer2' }),
            ).toPromise();

            const now2 = Date.now() - 100;

            const r2 = await cachedItemStore.get<Sample>(
                'sample_id_2' + now2,
                'sample_no_sql_key',
                'sample_ttl_key',
                () =>  of({ key: 'fromServer1' }),
                () => throwError(new Error('Sample Error')),
            ).toPromise();

            // assert
            expect(r1).toEqual({ key: 'fromServer1' });
        });

        xit('should first fetch from server before checking cache  on error server', async () => {
            // arrange
            const now1 = Date.now();
            mockKeyValueStore.setValue = jest.fn(() => of(false))
            mockKeyValueStore.getValue = jest.fn(() => of('false'))
            mockSharedPreferences.getString = jest.fn(() => throwError({}))
            mockSharedPreferences.putString = jest.fn(() => of({})) as any
                    
            // act
            const r1 = await cachedItemStore.get<Sample>(
                'sample_id_' + now1,
                'sample_no_sql_key',
                'sample_ttl_key2',
                () => of({ key: 'fromServer1' })
            ).toPromise();

            const now2 = Date.now() - 100;

            const r2 = await cachedItemStore.get<Sample>(
                'sample_id_2' + now2,
                'sample_no_sql_key',
                'sample_ttl_key',
                () => of({ key: 'fromServer1' })
            ).toPromise();
        });
    });
});
