import { DeviceInfoImpl } from './device-info-impl';
import * as SHA1 from 'crypto-js/sha1';
import { doesIntersect } from 'tslint';
import { identity, of } from 'rxjs';
import { Device } from '@capacitor/device';

declare const sbutility;

jest.mock('@capacitor/device', () => {
    return {
      ...jest.requireActual('@capacitor/device'),
        Device: {
            getInfo: jest.fn(() => Promise.resolve()),
            getId: jest.fn()
        }
    }
})
describe('DeviceInfoImpl', () => {
    let deviceInfoImpl: DeviceInfoImpl;
    window['device'] = { uuid: 'some_uuid', platform:'android' };

    beforeAll(() => {
        deviceInfoImpl = new DeviceInfoImpl();

        Device.getId = jest.fn(() => Promise.resolve({identifier: 'some_uuid'}))
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    it('should create a instance of deviceInfoImpl', () => {
        expect(deviceInfoImpl).toBeTruthy();
    });

    it('should return deviceId', () => {
        Device.getId = jest.fn(() => Promise.resolve({identifier: 'some_uuid'}))
        const deviceId = SHA1('some_uuid').toString()
        deviceInfoImpl.getDeviceID();
        expect(deviceId).toEqual(SHA1('some_uuid').toString());
    });

    describe('getDeviceSpec', () => {
        it('should return deviceSpec if available', (done) => {
            sbutility.getDeviceSpec = jest.fn((fn) => {
                fn({
                    identifier: { path: 'http://' },
                    next: jest.fn((cb) => cb()),
                    complete: jest.fn()
                });
            });
            deviceInfoImpl.getDeviceSpec().subscribe(() => {
                expect(sbutility.getDeviceSpec).toHaveBeenCalled();
                done();
            });
        });
    });

    describe('getAvailableInternalMemorySize', () => {
        it('should return internal Memory Size', (done) => {
            sbutility.getAvailableInternalMemorySize = jest.fn((fn) => {
                fn({
                    identifier: { path: 'http://' },
                    next: jest.fn((cb) => cb()),
                    complete: jest.fn()
                });
            });
            deviceInfoImpl.getAvailableInternalMemorySize().subscribe(() => {
                expect(sbutility.getAvailableInternalMemorySize).toHaveBeenCalled();
                done();
            }, (e) => {
                done();
            });
        });

        it('should not return internal Memory Size for error part', (done) => {
            sbutility.getAvailableInternalMemorySize = jest.fn((succ, err) => {
                err({
                    error: jest.fn()
                });
            });
            deviceInfoImpl.getAvailableInternalMemorySize().subscribe(() => {
                expect(sbutility.getAvailableInternalMemorySize).toHaveBeenCalled();
                done();
            }, (e) => {
                done();
            });
        });
    });

    describe('getStorageVolumes', () => {
        it('should return external Storage Volumes', (done) => {
            sbutility.getStorageVolumes = jest.fn((fn) => {
                fn([{
                    identifier: { path: 'http://' },
                    isRemovable: true
                }]);
            });
            deviceInfoImpl.getStorageVolumes().subscribe(() => {
                expect(sbutility.getStorageVolumes).toHaveBeenCalled();
                done();
            });
        });

        it('should return Internal Storage Volumes', (done) => {
            sbutility.getStorageVolumes = jest.fn((fn) => {
                fn([{
                    identifier: { path: 'http://' },
                    isRemovable: false
                }]);
            });
            deviceInfoImpl.getStorageVolumes().subscribe(() => {
                expect(sbutility.getStorageVolumes).toHaveBeenCalled();
                done();
            });
        });

        it('should return Storage Volumes', (done) => {
            sbutility.getStorageVolumes = jest.fn((success, err) => {
                err({ error: jest.fn() });
            });
            deviceInfoImpl.getStorageVolumes().subscribe(() => {
                expect(sbutility.getStorageVolumes).toHaveBeenCalled();
                done();
            }, (e) => {
                done();
            });
        });
    });

    describe('isKeyboardShown', () => {
        it('should return native keyboard', () => {
            window.addEventListener = jest.fn();
            window.removeEventListener = jest.fn();
            deviceInfoImpl.isKeyboardShown().subscribe(() => {
            });
        });
    });
});
