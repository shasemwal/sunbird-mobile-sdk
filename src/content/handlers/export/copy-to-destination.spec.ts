import { CopyToDestination } from './copy-to-destination';
import {FileService} from '../../../util/file/def/file-service';
import {ContentEntry} from '../../db/schema';
import {Response} from '../../../api';
import { Device } from '@capacitor/device';

declare const sbutility;
jest.mock('@capacitor/device', () => {
    return {
      ...jest.requireActual('@capacitor/device'),
        Device: {
            getInfo: jest.fn()
        }
    }
})

describe('CopyToDestination', () => {
    let copyToDestination: CopyToDestination;
    const mockFileService: Partial<FileService> = {};

    beforeAll(() => {
        copyToDestination = new CopyToDestination();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be create a instance of copy asset', () => {
        expect(copyToDestination).toBeTruthy();
    });

    it('should be copied a file by invoked exicute() for error MEssage', () => {
        // arrange
        Device.getInfo = jest.fn(() => Promise.resolve({ uuid: 'some_uuid', platform:'aandroid' })) as any;
        const contentEntrySchema: ContentEntry.SchemaMap[] = [{
            identifier: 'IDENTIFIER',
            server_data: 'SERVER_DATA',
            local_data: '{"children": [{"DOWNLOAD": 1}, "do_234", "do_345"], "artifactUrl": "http:///do_123"}',
            mime_type: 'MIME_TYPE',
            manifest_version: 'MAINFEST_VERSION',
            content_type: 'CONTENT_TYPE',
            content_state: 2,
            primary_category: 'textbook'
        }];

        const exportContext = {
            destinationFolder: 'SAMPLE_DESTINATION_FOLDER',
            tmpLocationPath: 'SAMPLE_TEMP_PATH',
            contentModelsToExport: contentEntrySchema,
            items: ['artifactUrl'],
            metadata: {'SAMPLE_KEY': 'SAMPLE_META_DATA'},
            ecarFilePath: 'sampledir/samplefile'
        };
        const contentExportRequest = {
            destinationFolder: 'dest-folder',
            contentIds: [''],
            saveLocally: true
        };
        const response: Response = new Response();
        copyToDestination = new CopyToDestination();

        response.body = exportContext;
        jest.spyOn(sbutility, 'copyFile').mockReturnValue((a, b, c, d, e) => {
            setTimeout(() => {
                setTimeout(() => {
                    d();
                }, 0);
            });
        });
        // act
        copyToDestination.execute(response, contentExportRequest).then((result) => {
            // assert
            expect(contentExportRequest.saveLocally).toBeTruthy();
        }).catch((e) => {
           console.error(e);
        });
    });

    it('should be copied a file by invoked exicute() for error MEssage', () => {
        // arrange
        const contentEntrySchema: ContentEntry.SchemaMap[] = [{
            identifier: 'IDENTIFIER',
            server_data: 'SERVER_DATA',
            local_data: '{"children": [{"DOWNLOAD": 1}, "do_234", "do_345"], "artifactUrl": "http:///do_123"}',
            mime_type: 'MIME_TYPE',
            manifest_version: 'MAINFEST_VERSION',
            content_type: 'CONTENT_TYPE',
            content_state: 2,
            primary_category: 'textbook'
        }];

        const exportContext = {
            destinationFolder: 'SAMPLE_DESTINATION_FOLDER',
            tmpLocationPath: 'SAMPLE_TEMP_PATH',
            contentModelsToExport: contentEntrySchema,
            items: ['artifactUrl'],
            metadata: {'SAMPLE_KEY': 'SAMPLE_META_DATA'},
            ecarFilePath: 'sampledir/samplefile'
        };
        const contentExportRequest = {
            destinationFolder: 'dest-folder',
            contentIds: [''],
            saveLocally: false
        };
        const response: Response = new Response();
        copyToDestination = new CopyToDestination();

        response.body = exportContext;
        jest.spyOn(sbutility, 'copyFile').mockReturnValue((a, b, c, d, e) => {
            setTimeout(() => {
                setTimeout(() => {
                    e();
                }, 0);
            });
        });
        // act
        copyToDestination.execute(response, contentExportRequest).then((result) => {
            // assert
            expect(contentExportRequest.saveLocally).toBeFalsy();
        });
    });

});
