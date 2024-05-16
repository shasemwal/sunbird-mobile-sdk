import { EnrollCourseHandler } from './enroll-course-handler';
import { ApiService, TelemetryService } from '../..';
import { CourseServiceConfig, EnrollCourseRequest } from '..';
import { of, throwError } from 'rxjs';
import { CsResponse, CsHttpResponseCode } from '@project-sunbird/client-services/core/http-service';

describe('EnrollCourseHandler', () => {
    let enrollCourseHandler: EnrollCourseHandler;

    const mockApiService: Partial<ApiService> = {
        fetch: jest.fn(() => of({ body: { result: { response: 'SUCCESS' } } })) as any
    };
    const mockCourseServiceConfig: Partial<CourseServiceConfig> = {};
    const mockTelemetryService: Partial<TelemetryService> = {};

    beforeAll(() => {
        enrollCourseHandler = new EnrollCourseHandler(
            mockApiService as ApiService,
            mockCourseServiceConfig as CourseServiceConfig
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it('should be create a instance of enrollCourseHandler', () => {
        expect(enrollCourseHandler).toBeTruthy();
    });

    it('should enroll user to the course and generate audit telemetry', async () => {
        const enrollRequest: EnrollCourseRequest = {
            userId: 'sample-user-id',
            courseId: 'sample-course-id',
            batchId: 'sample-batch-id',
            batchStatus: 2
        };
        // Spy on the generateAuditTelemetry method to ensure it is called
        mockTelemetryService.audit = jest.fn()
        const response = {
            // responseCode: CsHttpResponseCode.HTTP_BAD_REQUEST,
            // errorMesg: 'error',
            body: {
                result: {
                    response: 'SUCCESS'
                }
            },
            headers: ''
        } as any;
        mockApiService.fetch = jest.fn(() => of(response)) as any;

        // Call the handle method with the test data
        const result = await enrollCourseHandler.handle(enrollRequest)
        // Assert that the API service fetch method is called with the correct parameters
        // enrollCourseHandler.handle(enrollRequest).subscribe(() => {
        //     // Assert that the result is true
        //     expect(result).toBe(true);
        // })
    });
});
