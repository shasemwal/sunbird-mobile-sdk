import {SummaryTelemetryEventHandler} from './summary-telemetry-event-handler';
import {Content, ContentService, CourseService, EventsBusService, ProfileService, SharedPreferences, TelemetryObject} from '../..';
import {SummarizerService} from '..';
import {telemetry} from './summary-telemetry-event-handler.spec.data';
import {of} from 'rxjs';
import {TelemetryLogger} from '../../telemetry/util/telemetry-logger';
import {TelemetryService} from '../../telemetry';
import {CsPrimaryCategory} from '@project-sunbird/client-services/services/content';

jest.mock('../../telemetry/util/telemetry-logger');

describe('SummaryTelemetryEventHandler', () => {
    let summaryTelemetryEventHandler: SummaryTelemetryEventHandler;
    const mockCourseService: Partial<CourseService> = {
        resetCapturedAssessmentEvents: jest.fn(),
        captureAssessmentEvent: jest.fn()
    };
    const mockSharedPreference: Partial<SharedPreferences> = {
        getString: jest.fn(() => of(JSON.stringify({"userId": "user_id","courseId": "course_Id","batchId": "batch_id"}))) 
    };
    const mockSummarizerService: Partial<SummarizerService> = {
        saveLearnerAssessmentDetails: jest.fn(() => of({})) as any,
        saveLearnerContentSummaryDetails: jest.fn(() => of({})) as any
    };
    const mockEventBusService: Partial<EventsBusService> = {};
    const mockContentService: Partial<ContentService> = {
        setContentMarker: jest.fn(() => of({})) as any
    };
    const mockProfileService: Partial<ProfileService> = {
        addContentAccess: jest.fn(() => of({})) as any
    };


    beforeAll(() => {
        summaryTelemetryEventHandler = new SummaryTelemetryEventHandler(
            mockCourseService as CourseService,
            mockSharedPreference as SharedPreferences,
            mockSummarizerService as SummarizerService,
            mockEventBusService as EventsBusService,
            mockContentService as ContentService,
            mockProfileService as ProfileService
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be create a instance of summaryTelemetryEventHandler', () => {
        expect(summaryTelemetryEventHandler).toBeTruthy();
    });

    it('should update content state if batch is not expire for START event', (done) => {
        // arrange
        mockSharedPreference.getString = jest.fn(() => of('{"userId": "user_id","courseId": "course_Id","batchId": "batch_id", "batchStatus": 1}'));
        mockCourseService.getContentState = jest.fn(() => of({contentList: [{contentId: '', status: 0}]})) as any;
        mockCourseService.updateContentState = jest.fn(() => of(true));
        mockSharedPreference.putString = jest.fn().mockImplementation(() => {
        });
        mockContentService.getContentDetails = jest.fn().mockImplementation(() => {
            return of({
                name: 'CONTENT_NAME',
                contentType: 'course',
                sections: {},
                contentData: {
                    contentType: 'contentType',
                    pkgVersion: '1',
                    trackable: {
                        enabled: 'Yes'
                    }
                }
            }) as Partial<Content> as Content;
        });
        const data = (mockSharedPreference.putString as jest.Mock).mockReturnValue(of('SAMPLE_RESULT'));
        // act
        summaryTelemetryEventHandler.updateContentState(telemetry).subscribe(() => {
            // assert
            expect(mockSharedPreference.getString).toHaveBeenCalled();
            expect(mockProfileService.addContentAccess).toBeTruthy();
            expect(mockCourseService.getContentState).toHaveBeenCalled();
            expect(mockSharedPreference.putString).toHaveBeenCalled();
            done();
        });
    });

    it('should update content state if batch is not expire END event', (done) => {
        // arrange
        const mockTelemetryService: Partial<TelemetryService> = {
            audit: jest.fn().mockImplementation(() => of(true))
        };
        (TelemetryLogger as any)['log'] = mockTelemetryService;
        telemetry.eid = 'END';
        mockSharedPreference.getString = jest.fn(() => of('{"userId": "user_id","courseId": "course_Id","batchId": "batch_id", "batchStatus": 1}'));
        mockCourseService.getContentState = jest.fn(() => of({})) as any;
        mockCourseService.resetCapturedAssessmentEvents = jest.fn().mockImplementation(() => {
        });
        mockContentService.getContentDetails = jest.fn().mockImplementation(() => {
        });
        (mockContentService.getContentDetails as jest.Mock).mockReturnValue(of(
            {
                name: 'CONTENT_NAME',
                contentType: 'course',
                sections: {},
                contentData: {
                    contentType: 'contentType',
                    pkgVersion: '1',
                    trackable: {
                        enabled: 'Yes'
                    }
                }
            }
            )
        );
        telemetry.edata.summary = [{progress: 100}];
        mockEventBusService.emit = jest.fn().mockImplementation(() => {
        });
        (mockEventBusService.emit as jest.Mock).mockReturnValue(of());
        mockSharedPreference.putString = jest.fn().mockImplementation(() => {
        });
        mockCourseService.updateContentState = jest.fn(() => of(true));
        // act
        const data = (mockSharedPreference.putString as jest.Mock).mockReturnValue(of('SAMPLE_RESULT'));
        // act
        summaryTelemetryEventHandler.updateContentState(telemetry).subscribe(() => {
            // assert
            expect(mockSharedPreference.getString).toHaveBeenCalled();
            expect(mockCourseService.getContentState).toHaveBeenCalled();
            expect(mockContentService.getContentDetails).toHaveBeenCalled();
            expect(mockEventBusService.emit).toHaveBeenCalled();
            expect(mockSharedPreference.putString).toHaveBeenCalled();
            done();
        });
    });

    it('should update content state if eid is empty and return undefined', (done) => {
        // arrange
        const mockTelemetryService: Partial<TelemetryService> = {
            audit: jest.fn().mockImplementation(() => of(true))
        };
        (TelemetryLogger as any)['log'] = mockTelemetryService;
        telemetry.eid = '';
        mockSharedPreference.getString = jest.fn(() => of('{"userId": "user_id","courseId": "course_Id","batchId": "batch_id", "batchStatus": 1}'));
        mockCourseService.getContentState = jest.fn(() => of({})) as any;
        // act
        summaryTelemetryEventHandler.updateContentState(telemetry).subscribe(() => {
            // assert
            expect(mockSharedPreference.getString).toHaveBeenCalled();
            expect(mockCourseService.getContentState).toHaveBeenCalled();
            done();
        });
    });

    it('should update content state if batch is not expire for Invalid END event', (done) => {
        // arrange
        telemetry.eid = 'END';
        mockSharedPreference.getString = jest.fn(() => of('{"userId": "user_id","courseId": "course_Id","batchId": "batch_id", "batchStatus": 1}'));
        // mockProfileService.addContentAccess = jest.fn().mockImplementation(() => { });
        // (mockProfileService.addContentAccess as jest.Mock).mockReturnValue(of(true));
        mockCourseService.getContentState = jest.fn().mockImplementation(() => {
        });
        (mockCourseService.getContentState as jest.Mock).mockReturnValue(of({}));
        mockCourseService.resetCapturedAssessmentEvents = jest.fn().mockImplementation(() => {
        });
        mockContentService.getContentDetails = jest.fn().mockImplementation(() => {
        });
        (mockContentService.getContentDetails as jest.Mock).mockReturnValue(of({
            name: 'CONTENT_NAME',
            sections: {},
            contentType: 'SELFASSESS',
            contentData: {
                trackable: {
                    enabled: 'Yes'
                }
            },
            primaryCategory: CsPrimaryCategory.COURSE_ASSESSMENT
        }));
        mockCourseService.hasCapturedAssessmentEvent = jest.fn().mockImplementation(() => {
        });
        (mockCourseService.hasCapturedAssessmentEvent as jest.Mock).mockReturnValue(true);
        telemetry.edata.summary = [{progress: -2}];
        mockEventBusService.emit = jest.fn().mockImplementation(() => {
        });
        (mockEventBusService.emit as jest.Mock).mockReturnValue(of());
        // mockCourseService.updateContentState = jest.fn().mockImplementation(() => {});
        // (mockCourseService.updateContentState as jest.Mock).mockReturnValue(of(true));
        mockSharedPreference.putString = jest.fn().mockImplementation(() => {
        });
        const data = (mockSharedPreference.putString as jest.Mock).mockReturnValue(of('SAMPLE_RESULT'));
        // act
        summaryTelemetryEventHandler.updateContentState(telemetry).subscribe(() => {
            // assert
            expect(mockSharedPreference.getString).toHaveBeenCalled();
            expect(mockCourseService.getContentState).toHaveBeenCalled();
            expect(mockContentService.getContentDetails).toHaveBeenCalled();
            expect(mockSharedPreference.putString).toHaveBeenCalled();
            done();
        });
    });

    it('should not update content state if batch is expired', (done) => {
        // arrange
        telemetry.eid = 'START';
        mockSharedPreference.getString = jest.fn(() => of(''));
        mockProfileService.addContentAccess = jest.fn(() => of(true));
        // act
        summaryTelemetryEventHandler.updateContentState(telemetry).subscribe(() => {
            // assert
            expect(mockSharedPreference.getString).toHaveBeenCalled();
            expect(mockProfileService.addContentAccess).toBeTruthy();
            done();
        });
    });

    it('should added content in content marker table for pid is contentPlayer', (done) => {
        // arrange
        mockCourseService.resetCapturedAssessmentEvents = () => of('DEFAULT_CHANNEL');
        // act
        summaryTelemetryEventHandler.handle(telemetry).subscribe(() => {
            // assert
            done();
        });
    });

    it('should added content in content marker table for pid is null or empty', (done) => {
        // arrange
        let telemetry = { ver: '3.0',
        eid: 'START',
        ets: 1572861279365,
        actor: {
            type: 'User',
            id: '85f16f8b-fc5b-4834-993b-4e88b224ccfa'
        },
        object: {type: 'Multiple Choice Question'},
        context: {
            channel: '505c7c48ac6dc1edc9b08f21db5a571d',
            pdata: {pid: ''}
        }} as any
        mockCourseService.resetCapturedAssessmentEvents = () => of('DEFAULT_CHANNEL');
        // act
        summaryTelemetryEventHandler.handle(telemetry).subscribe(() => {
            // assert
            done();
        });
    });

    it('should implement for course service event telemetry', (done) => {
        // arrange
        telemetry.context.pdata.pid = '';
        mockSharedPreference.getString = jest.fn(() => of('{"userId": "user_id","courseId": "course_Id","batchId": "batch_id"}'));
        // telemetry.object = {type: "Practice Question Set"};
        // act
        summaryTelemetryEventHandler.handle(telemetry).subscribe(() => {
            // assert
            expect(mockSharedPreference.getString).toHaveBeenCalledWith(expect.any(String));
            done();
        });
    });

    it('should delete previous assessment details for ASSESS event', (done) => {
        // arrange
        let telemetry = {
            ver: '3.0',
            ets: 1572861279365,
            object: {id: '836e43c400f286df82f489e7ea90fe26be64fdc6', type: "Practice Question Set"},
            actor: {
                type: 'User',
                id: '85f16f8b-fc5b-4834-993b-4e88b224ccfa'
            },
            eid: 'ASSESS',
            context: {
                pdata: {pid: 'contentplayer'},
                cdata: [{type: 'AttemptId'}],
            }
        } as any
        mockSharedPreference.getString = jest.fn(() => of('{"userId": "user_id","courseId": "course_Id","batchId": "batch_id"}'));
        mockSummarizerService.deletePreviousAssessmentDetails = jest.fn(() => of({
            currentUID: undefined,
            currentContentID: undefined
        })) as any;
        mockCourseService.captureAssessmentEvent = jest.fn(() => Promise.resolve(true))
        // act
        summaryTelemetryEventHandler.handle(telemetry).subscribe(() => {
            // assert
            expect(mockSharedPreference.getString).toHaveBeenCalled();
            done();
        });
    });

    it('should delete previous assessment details for END event', (done) => {
        // arrange
        // telemetry.eid = 'END';
        let telemetry = {
            ver: '3.0',
            ets: 1572861279365,
            object: {type: "Practice Question Set"},
            actor: {
                type: 'User',
                id: '85f16f8b-fc5b-4834-993b-4e88b224ccfa'
            },
            eid: 'END',
            context: {
                pdata: {pid: 'contentplayer'},
                cdata: [{type: 'AttemptId'}],
            }
        } as any
        mockSharedPreference.putString = jest.fn(() => of('SAMPLE_RESULT')) as any;
        // act
        summaryTelemetryEventHandler.handle(telemetry).subscribe(() => {
            // assert
            // expect(mockSharedPreference.getString).toHaveBeenCalled();
            done();
        });
    });

    it('should generate telemetry for END event and invoked setCourseContextEmpty()', (done) => {
        // arrange
        telemetry.eid = 'END';
        telemetry.context.pdata.pid = 'sunbird.app';
        // act
        summaryTelemetryEventHandler.handle(telemetry).subscribe(() => {
            // assert
            //   expect(mockCourseService.updateContentState).toHaveBeenCalled();
            done();
        });
    });

    it('should generate telemetry for END event and invoked setCourseContextEmpty()', (done) => {
        // arrange
        telemetry.eid = 'ERROR';
        telemetry.context.pdata.pid = 'sunbird.app';
        // act
        summaryTelemetryEventHandler.handle(telemetry).subscribe(() => {
            // assert
            done();
        });
    });

    describe('TrackableSessionProxyContentProvider', () => {
        // tslint:disable-next-line:no-shadowed-variable
        let summaryTelemetryEventHandler: SummaryTelemetryEventHandler;

        const constructNewInstance = () => {
            summaryTelemetryEventHandler = new SummaryTelemetryEventHandler(
                mockCourseService as CourseService,
                mockSharedPreference as SharedPreferences,
                mockSummarizerService as SummarizerService,
                mockEventBusService as EventsBusService,
                mockContentService as ContentService,
                mockProfileService as ProfileService
            );
        };

        describe('when no contents have been cached', () => {
            describe('when a START event is detected for a non-trackable content', () => {
                it('should fetch contents without a cache-proxy', async () => {
                    // arrange
                    constructNewInstance();

                    const telemetryObject1 = new TelemetryObject('some_content_id_1', 'resource', '');
                    const startEvent1 = {...telemetry, eid: 'START', object: telemetryObject1};
                    const telemetryObject2 = new TelemetryObject('some_content_id_2', 'resource', '');
                    const startEvent2 = {...telemetry, eid: 'START', object: telemetryObject2};
                    const contentStack = [
                        {
                            name: 'CONTENT_NAME',
                            contentType: 'course',
                            sections: {},
                            contentData: {
                                contentType: 'contentType',
                                pkgVersion: '1',
                            }
                        },
                        {
                            name: 'CONTENT_NAME',
                            contentType: 'course',
                            sections: {},
                            contentData: {
                                contentType: 'contentType',
                                pkgVersion: '1'
                            }
                        },
                    ];
                    mockContentService.getContentDetails = jest.fn().mockImplementation(() => {
                        return of(contentStack.pop()) as Partial<Content> as Content;
                    });

                    // act
                    await summaryTelemetryEventHandler.handle(startEvent1).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent2).toPromise();

                    // assert
                    expect(mockContentService.getContentDetails).toHaveBeenNthCalledWith(1, {contentId: 'some_content_id_1'});
                    expect(mockContentService.getContentDetails).toHaveBeenNthCalledWith(2, {contentId: 'some_content_id_2'});
                    // done();
                });
            });

            describe('when a START event is detected for a trackable content', () => {
                it('should fetch consecutive contents with a cache-proxy till a trackable END event occurs', async () => {
                    // arrange
                    constructNewInstance();

                    const startTelemetryObject1 = new TelemetryObject('some_content_id_1', 'resource', '');
                    const startEvent1 = {...telemetry, eid: 'START', object: startTelemetryObject1};
                    const startTelemetryObject2 = new TelemetryObject('some_content_id_2', 'resource', '');
                    const startEvent2 = {...telemetry, eid: 'START', object: startTelemetryObject2};
                    const endTelemetryObject1 = new TelemetryObject('some_content_id_1', 'resource', '');
                    const endEvent1 = {...telemetry, eid: 'END', object: endTelemetryObject1};
                    const startTelemetryObject3 = new TelemetryObject('some_content_id_3', 'resource', '');
                    const startEvent3 = {...telemetry, eid: 'START', object: startTelemetryObject3};
                    const contentStack = [
                        {
                            identifier: 'some_content_id_2',
                            name: 'CONTENT_NAME_2',
                            contentType: 'course',
                            sections: {},
                            contentData: {
                                contentType: 'contentType',
                                pkgVersion: '1',
                            }
                        },
                        {
                            identifier: 'some_content_id_2',
                            name: 'CONTENT_NAME_2',
                            contentType: 'course',
                            sections: {},
                            contentData: {
                                contentType: 'contentType',
                                pkgVersion: '1',
                            }
                        },
                        {
                            identifier: 'some_content_id_2',
                            name: 'CONTENT_NAME_2',
                            contentType: 'course',
                            sections: {},
                            contentData: {
                                contentType: 'contentType',
                                pkgVersion: '1',
                            }
                        },
                        {
                            identifier: 'some_content_id_3',
                            name: 'CONTENT_NAME_3',
                            contentType: 'course',
                            sections: {},
                            contentData: {
                                contentType: 'contentType',
                                pkgVersion: '1',
                            }
                        },
                        {
                            identifier: 'some_content_id_2',
                            name: 'CONTENT_NAME_2',
                            contentType: 'course',
                            sections: {},
                            contentData: {
                                contentType: 'contentType',
                                pkgVersion: '1',
                            }
                        },
                        {
                            identifier: 'some_content_id_1',
                            name: 'CONTENT_NAME_1',
                            contentType: 'course',
                            sections: {},
                            contentData: {
                                contentType: 'contentType',
                                pkgVersion: '1',
                                trackable: {
                                    enabled: 'Yes'
                                }
                            }
                        },
                    ];
                    mockContentService.getContentDetails = jest.fn().mockImplementation(() => {
                        return of(contentStack.pop()) as Partial<Content> as Content;
                    });

                    // act
                    await summaryTelemetryEventHandler.handle(startEvent1).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent2).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent2).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent2).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent2).toPromise();
                    await summaryTelemetryEventHandler.handle(endEvent1).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent3).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent2).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent2).toPromise();
                    await summaryTelemetryEventHandler.handle(startEvent2).toPromise();

                    // assert
                    expect(mockContentService.getContentDetails).toHaveBeenNthCalledWith(1, {contentId: 'some_content_id_1'});
                    expect(mockContentService.getContentDetails).toHaveBeenNthCalledWith(2, {contentId: 'some_content_id_2'});
                    expect(mockContentService.getContentDetails).toHaveBeenNthCalledWith(3, {contentId: 'some_content_id_3'});
                    expect(mockContentService.getContentDetails).toHaveBeenNthCalledWith(4, {contentId: 'some_content_id_2'});
                    expect(mockContentService.getContentDetails).toHaveBeenNthCalledWith(5, {contentId: 'some_content_id_2'});
                    expect(mockContentService.getContentDetails).toHaveBeenNthCalledWith(6, {contentId: 'some_content_id_2'});
                    expect(mockContentService.getContentDetails).toHaveBeenCalledTimes(6);
                });
            });
        });
    });
});
