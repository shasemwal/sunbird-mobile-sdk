import {WriteManifest} from './write-manifest';
import {FileService} from '../../../util/file/def/file-service';
import {ContentEntry} from '../../db/schema';
import {ContentErrorCode, ExportContentContext} from '../..';
import {DeviceInfo} from '../../..';
import {of} from 'rxjs';

describe('writeManifest', () => {
    let writeManifest: WriteManifest;
    const mockFileService: Partial<FileService> = {
        writeFile: jest.fn().mockImplementation(() => {
        })
    };
    const mockDeviceInfo: Partial<DeviceInfo> = {
        getAvailableInternalMemorySize: jest.fn(() => of({})) as any
    };

    beforeAll(() => {
        writeManifest = new WriteManifest(
            mockFileService as FileService,
            mockDeviceInfo as DeviceInfo
        );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be create instance of ecarBundle', () => {
        expect(writeManifest).toBeTruthy();
    });

    describe('execute', () => {
        let exportContentContext;
    
        beforeEach(() => {
            exportContentContext = {
                tmpLocationPath: '/tmp',
                manifest: { }
            };
        });
    
        it('should write manifest and return response with context when device space is sufficient', async () => {
            mockDeviceInfo.getAvailableInternalMemorySize = jest.fn(() => of(1024 * 1024 + 1)) as any; // Mocking insufficient space
            mockFileService.writeFile = jest.fn(() => Promise.resolve()) as any
            const result = await writeManifest.execute({
                tmpLocationPath: '/tmp',
                manifest: { }
            } as any);
    
            // act
            writeManifest.execute(exportContentContext);
        });
    
        it('should return error response when device space is insufficient', async () => {
            mockDeviceInfo.getAvailableInternalMemorySize = jest.fn(() => of(1024 * 1024 - 1)) as any; // Mocking insufficient space
    
            let expectedResult = '{\"errorMesg\":\"EXPORT_FAILED_WRITE_MANIFEST\"}'
    
            try {
                await writeManifest.execute({
                    tmpLocationPath: '/tmp',
                manifest: { }
                } as any);
            } catch (error) {
            }
        });
    
        it('should return error response when writing manifest fails', async () => {
            mockFileService.writeFile = jest.fn(() => Promise.reject(new Error('Write error'))); // Mocking file write failure
    
            const expectedResult = '{\"errorMesg\":\"EXPORT_FAILED_WRITE_MANIFEST\"}'
    
            try {
                await writeManifest.execute({
                    tmpLocationPath: '/tmp',
                    manifest: { }
                } as any);
            } catch (error) {
            }
        });
    });

});
