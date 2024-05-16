import {DbService} from '../../db';
import {GetAllGroupRequestDeprecated, GroupDeprecated, GroupServiceDeprecated, ProfilesToGroupRequestDeprecated} from '..';
import {ProfileService} from '../../profile';
import {SharedPreferences} from '../../util/shared-preferences';
import {GroupKeys} from '../../preference-keys';
import {Actor, AuditState, ObjectType, TelemetryService} from '../../telemetry';
import {Container} from 'inversify';
import {InjectionTokens} from '../../injection-tokens';
import {GroupServiceDeprecatedImpl} from './group-service-deprecated-impl';
import {instance, mock} from 'ts-mockito';
import {of} from 'rxjs';
import { GroupEntry } from '../db/schema';

describe('GroupServiceImpl', () => {

    let groupService: GroupServiceDeprecated;
    const container = new Container();
    const mockDbService: Partial<DbService> = {
        insert: jest.fn().mockReturnValue(of(null))
    };

    const mockProfileService: Partial<ProfileService> = {
        getActiveProfileSession: jest.fn().mockReturnValue(of({ uid: 'mockUserId' }))
    };

    const mockTelemetryService: Partial<TelemetryService> = {
        audit: jest.fn().mockReturnValue(of(null)),
        feedback: jest.fn().mockImplementation(() => {})
    };
    const mockSharedPreferences: SharedPreferences = instance(mock<SharedPreferences>());
    beforeAll(() => {
        container.bind<GroupServiceDeprecated>(InjectionTokens.GROUP_SERVICE).to(GroupServiceDeprecatedImpl);
        container.bind<Container>(InjectionTokens.CONTAINER).toConstantValue(container);
        container.bind<DbService>(InjectionTokens.DB_SERVICE).toConstantValue(mockDbService as DbService);
        container.bind<ProfileService>(InjectionTokens.PROFILE_SERVICE).toConstantValue(mockProfileService as ProfileService);
        container.bind<SharedPreferences>(InjectionTokens.SHARED_PREFERENCES).toConstantValue(mockSharedPreferences);
        container.bind<TelemetryService>(InjectionTokens.TELEMETRY_SERVICE).toConstantValue(mockTelemetryService as TelemetryService);

        groupService = container.get(InjectionTokens.GROUP_SERVICE);
        groupService = container.get(InjectionTokens.TELEMETRY_SERVICE);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an instance of GroupServiceImpl from container', () => {
        expect(groupService).toBeTruthy();
    });


    it('should return Create Group DBEntry Using ProfileService', () => {
        // arrange
        const group: GroupDeprecated = {
            gid: 'SAMPLE_UID',
            name: 'SAMPLE_NAME',
            syllabus: ['ENGLISH', 'MATHS'],
            grade: ['GRADE1', 'GRADE2'],
            gradeValue: {key: 'SAMPLE_KEY'},
            createdAt: 123,
            updatedAt: 1234
        };
        mockDbService.insert = jest.fn().mockImplementation(() => of([]));
        mockProfileService.getActiveProfileSession = jest.fn().mockImplementation(() => of([]));
        // act
        groupService.createGroup = jest.fn().mockResolvedValue({ });

        // groupService.createGroup(group)
        // assert
        setTimeout(() => {
            expect(mockDbService.insert).toHaveBeenCalled();
            expect(mockProfileService.getActiveProfileSession).toHaveBeenCalled();
        }, 0);
    });

    describe('createGroup', () => {
        it('should create a group and perform telemetry audit', async () => {
            // Mock dependencies and setup initial conditions
            const mockGroup: GroupDeprecated = {
                gid: '',
                name: '',
                syllabus: [],
                createdAt: 0,
                grade: [],
                gradeValue: {},
                updatedAt: 0
            };
        
            // Call the createGroup method
            await groupService.createGroup(mockGroup);
            setTimeout(() => {
                // Assertions
                expect(mockDbService.insert).toHaveBeenCalledWith({
                    table: GroupEntry.TABLE_NAME,
                    modelJson: expect.objectContaining({ /* expected GroupDBEntry properties */ })
                });
                expect(mockProfileService.getActiveProfileSession).toHaveBeenCalled();
                expect(mockTelemetryService.audit).toHaveBeenCalledWith({
                    env: 'sdk',
                    actor: { id: 'mockUserId', type: Actor.TYPE_SYSTEM },
                    currentState: AuditState.AUDIT_CREATED,
                    updatedProperties: expect.any(Object),
                    objId: expect.any(String),
                    objType: ObjectType.GROUP
                });
            }, 0);
        });
    });
    it('should return Delete Group DBEntry Using ProfileService', () => {
        // arrange
        const group: GroupDeprecated = {
            gid: 'SAMPLE_UID',
            name: 'SAMPLE_NAME',
            syllabus: ['ENGLISH', 'MATHS'],
            grade: ['GRADE1', 'GRADE2'],
            gradeValue: {key: 'SAMPLE_KEY'},
            createdAt: 123,
            updatedAt: 1234
        };
        mockDbService.beginTransaction = jest.fn().mockImplementation(() => of([]));
        mockDbService.delete = jest.fn().mockImplementation(() => of([]));
        mockProfileService.getActiveProfileSession = jest.fn().mockImplementation(() => of([]));
        mockDbService.endTransaction = jest.fn().mockImplementation(() => of([]));
        // act
        groupService.deleteGroup = jest.fn().mockResolvedValue({})
            // assert
        setTimeout(() => {
            expect(mockDbService.delete).toHaveBeenCalled();
            expect(mockProfileService.getActiveProfileSession).toHaveBeenCalled();
        }, 0);
    });

    it('should return Update Group DBEntry Using ProfileService', () => {
        // arrange
        const group: GroupDeprecated = {
            gid: 'SAMPLE_UID',
            name: 'SAMPLE_NAME',
            syllabus: ['ENGLISH', 'MATHS'],
            grade: ['GRADE1', 'GRADE2'],
            gradeValue: {key: 'SAMPLE_KEY'},
            createdAt: 123,
            updatedAt: 1234
        };
        mockDbService.read = jest.fn().mockImplementation(() => of([]));
        mockDbService.update = jest.fn().mockImplementation(() => of([]));
        mockProfileService.getActiveProfileSession = jest.fn().mockImplementation(() => of([]));
        // act
        groupService.deleteGroup = jest.fn().mockResolvedValue({})
        setTimeout(() => {
            // assert
            expect(mockDbService.update).toHaveBeenCalled();
            expect(mockProfileService.getActiveProfileSession).toHaveBeenCalled();
        });
    });

    it('should return getActiveSessionGroup Using ProfileService', () => {
        // arrange
        mockDbService.read = jest.fn().mockImplementation(() => of([]));
        // jest.spyOn(groupService, 'getActiveGroupSession').mockReturnValue(of([]) as any);
        // act
        groupService.getActiveSessionGroup = jest.fn().mockResolvedValue(() => {
            // assert
            expect(mockDbService.read).toHaveBeenCalled();
            expect(groupService.getActiveGroupSession).toHaveBeenCalled();
        });
    });

    it('should return setActiveSessionForGroup Using ProfileService', () => {
        // arrange
        const gid = '123';
        mockDbService.read = jest.fn().mockImplementation(() => of([]));
        (mockDbService.read as jest.Mock).mockResolvedValue(of([]));
        mockSharedPreferences.putString = jest.fn().mockImplementation(() => of([]));
        (mockSharedPreferences.putString as jest.Mock).mockReturnValue(of(''));
        // jest.spyOn(groupService, 'setActiveSessionForGroup').mockReturnValue(of([]) as any);
        // act
        groupService.setActiveSessionForGroup = jest.fn().mockResolvedValue(() => {
            // assert
            expect(mockDbService.read).toHaveBeenCalled();
            expect(mockSharedPreferences.putString).toHaveBeenCalledWith(GroupKeys.KEY_GROUP_SESSION, JSON.stringify({
                gid: 'SAMPLE_GID',
                sid: 'SAMPLE_SID',
                createdTime: 123 }));
           // expect(groupService.setActiveSessionForGroup).toHaveBeenCalledWith(gid);
        });
    });

    it('should return getActiveGroupSession Using GroupService', () => {
        // arrange
        mockSharedPreferences.getString = jest.fn().mockImplementation(() => of([]));
        (mockSharedPreferences.getString as jest.Mock).mockReturnValue(of(''));
        // act
        groupService.getActiveGroupSession = jest.fn().mockResolvedValue(() => {
            // assert
            expect(mockSharedPreferences.getString).toHaveBeenCalledWith(GroupKeys.KEY_GROUP_SESSION);
        });
    });

    it('should return getAllGroups Using GroupService', () => {
        // arrange
        const groupRequest: GetAllGroupRequestDeprecated = {uid: '123'};
        mockDbService.execute = jest.fn().mockImplementation(() => of([]));
        mockDbService.read = jest.fn().mockImplementation(() => of([]));

        // act
        groupService.getAllGroups = jest.fn().mockResolvedValue(() => {
            // assert
            expect(mockDbService.execute).toHaveBeenCalled();
            expect(mockDbService.read).toHaveBeenCalled();
            expect(mockProfileService.getAllProfiles).toHaveBeenCalled();
        });
    });

    it('should return addProfilesToGroup Using GroupService', () => {
        // arrange
        const profileToGroupRequest: ProfilesToGroupRequestDeprecated = {groupId: '123', uidList: ['2', '23']};
        mockDbService.beginTransaction = jest.fn().mockImplementation(() => of([]));
        mockDbService.delete = jest.fn().mockImplementation(() => of([]));
        mockDbService.read = jest.fn().mockImplementation(() => of([]));
        mockDbService.endTransaction = jest.fn().mockImplementation(() => of([true]));

        // act
        groupService.addProfilesToGroup = jest.fn().mockResolvedValue(() => {
            // assert
            expect(mockDbService.beginTransaction).toHaveBeenCalled();
            expect(mockDbService.delete).toHaveBeenCalled();
            expect(mockDbService.read).toHaveBeenCalled();
            expect(mockDbService.endTransaction).toHaveBeenCalledWith(true);
            expect(mockProfileService.getAllProfiles).toHaveBeenCalled();
        });
    });
    it('should Catch addProfilesToGroup Using GroupService', () => {
        // arrange
        const profileToGroupRequest: ProfilesToGroupRequestDeprecated = {groupId: '123', uidList: ['2', '23']};
        mockDbService.beginTransaction = jest.fn().mockImplementation(() => of([]));
        mockDbService.delete = jest.fn().mockImplementation(() => of([]));
        mockDbService.read = jest.fn().mockImplementation(() => of([]));
        mockDbService.endTransaction = jest.fn().mockImplementation(() => of([false]));

        // act
        groupService.addProfilesToGroup = jest.fn().mockResolvedValue(() => {
            // assert
            expect(mockDbService.beginTransaction).toHaveBeenCalled();
            expect(mockDbService.delete).toHaveBeenCalled();
            expect(mockDbService.read).toHaveBeenCalled();
            expect(mockDbService.endTransaction).toHaveBeenCalledWith(false);
            expect(mockProfileService.getAllProfiles).toHaveBeenCalled();
        });
    });

    it('should return removeActiveGroupSession Using ProfileService', () => {
        // arrange
        mockSharedPreferences.putString = jest.fn().mockImplementation(() => of([]));
        (mockSharedPreferences.putString as jest.Mock).mockReturnValue(of(''));
        // act
        groupService.removeActiveGroupSession = jest.fn().mockResolvedValue(() => {
            // assert
            expect(groupService.getActiveGroupSession).toHaveBeenCalled();
            expect(mockSharedPreferences.putString).toHaveBeenCalledWith(GroupKeys.KEY_GROUP_SESSION, '');
        });
    });
});
