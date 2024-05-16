import {JwtUtil} from './jwt-util';
declare const sbutility;

jest.mock('../../plugins/sb-cordova-plugin-utility.d.ts', () => {
    return {
      ...jest.requireActual('../../plugins/sb-cordova-plugin-utility.d.ts'),
        sbutility: {
            decodeJWTToken: jest.fn(),
            getJWTToken: jest.fn()
        }
    }
})
describe('JwtUtil', () => {
    const mockToken = `mockToken`
    const mockError = new Error('Mock error');
    const mockDeviceId = 'mockDeviceId';
    const mockUserId = 'mockUserId';
            
    describe('decodeJWT()', () => {
        it('should resolve with decoded token', async () => {
            const mockDecodedToken = { userId: 'mockUserId' };

            // Mocking decodeJWTToken to resolve with mockDecodedToken
            sbutility.decodeJWTToken = jest.fn((accessToken, onSuccess) => {
                    onSuccess(mockDecodedToken);
                });
            
            const result = await JwtUtil.decodeJWT(mockToken);
            expect(result).toEqual(mockDecodedToken);
        });
    
        it('should reject with error', async () => {
            // Mocking decodeJWTToken to reject with mockError
            sbutility.decodeJWTToken = jest.fn((accessToken, onSuccess, onError) => {
                    onError(mockError);
                });
    
            await expect(JwtUtil.decodeJWT(mockToken)).rejects.toThrow(mockError);
        });
    });

    describe('createJWTToken', () => {
        it('should resolve with JWT token', async () => {
            // Mocking getJWTToken to resolve with mockToken
            sbutility.getJWTToken = jest.fn((deviceId, userId, onSuccess) => {
                    onSuccess(mockToken);
                });
    
            const result = await JwtUtil.createJWTToken(mockDeviceId, mockUserId);
            expect(result).toEqual(mockToken);
        });
    
        it('should reject with error', async () => {
            // Mocking getJWTToken to reject with mockError
            sbutility.getJWTToken = jest.fn((deviceId, userId, onSuccess, onError) => {
                    onError(mockError);
                });
    
            await expect(JwtUtil.createJWTToken(mockDeviceId, mockUserId)).rejects.toThrow(mockError);
        });
    });
});
