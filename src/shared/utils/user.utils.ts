

/** Manage to return the short name of the user */
const getShortNameUser = (firstName: string = '', lastName: string = ''): string => `${firstName} ${lastName}`.split(' ').map((split: string) => split[0]).join('')

export { getShortNameUser };