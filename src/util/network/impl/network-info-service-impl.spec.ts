import {Container} from 'inversify';
import {NetworkInfoService, NetworkStatus} from '..';
import {InjectionTokens} from '../../../injection-tokens';
import {NetworkInfoServiceImpl} from './network-info-service-impl';
import {take, toArray} from 'rxjs/operators';
import { Network } from '@capacitor/network';

jest.mock('@capacitor/network', () => {
    return {
      ...jest.requireActual('@capacitor/network'),
        Network: {
            getInfo: jest.fn()
        }
    }
})

describe.only('NetworkInfoServiceImpl', () => {
    let networkInfoService: NetworkInfoService;

    beforeAll(() => {
        window['Connection'] = {
            CELL: 'cellular',
            NONE: 'none',
            UNKNOWN: 'unknown',
            WIFI: 'wifi'
        };
        const container = new Container();
        container.bind<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE).to(NetworkInfoServiceImpl);
        networkInfoService = container.get<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE);
    });

    beforeEach(() => {
        Network.getStatus = jest.fn(() => Promise.resolve({connected: true, connectionType: 'cellular'})) as any
        jest.clearAllMocks();
    });

    it('should return instance from the container', () => {
        Network.getStatus = jest.fn(() => Promise.resolve({connected: false, connectionType: 'cellular'})) as any
        window['navigator']['connection'] = { type: 'none'};
        const container = new Container();
        container.bind<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE).to(NetworkInfoServiceImpl);
        networkInfoService = container.get<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE);

        expect(networkInfoService).toBeTruthy();
    });

    describe('networkStatus$', () => {
        it('should resolve to give default connection type "offline"', () => {
            // arrange
            Network.getStatus = jest.fn(() => Promise.resolve({connected: true, connectionType: 'cellular'})) as any
            window['navigator']['connection'] = { type: '3g'};
            const container = new Container();
            container.bind<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE).to(NetworkInfoServiceImpl);
            networkInfoService = container.get<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE);

            // act
        });

        it('should resolve to give default connection type "online"', () => {
            // arrange
            Network.getStatus = jest.fn(() => Promise.resolve({connected: false, connectionType: 'cellular'})) as any
            window['navigator']['connection'] = { type: 'none'};
            const container = new Container();
            container.bind<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE).to(NetworkInfoServiceImpl);
            networkInfoService = container.get<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE);

            // act
        });

        it('should resolve to give connection type when changed', () => {
            // arrange
            Network.getStatus = jest.fn(() => Promise.reject(new Error(''))) as any
            window['navigator']['connection'] = { type: 'none'};
            const container = new Container();
            container.bind<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE).to(NetworkInfoServiceImpl);
            networkInfoService = container.get<NetworkInfoService>(InjectionTokens.NETWORKINFO_SERVICE);
            // act
            window.dispatchEvent(new Event('online'));
            window.dispatchEvent(new Event('offline'));
        });
    });
});
