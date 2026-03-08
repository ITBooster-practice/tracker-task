import { SetMetadata } from '@nestjs/common'
import { ROLES_KEY, type TeamRole } from 'src/common/constants/roles.constants'

export const Roles = (...roles: TeamRole[]) => SetMetadata(ROLES_KEY, roles)
