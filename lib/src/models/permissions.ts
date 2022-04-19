import { User } from "./user";
import { AuthController } from "./auth";
import { EntityCollection } from "./collections";

/**
 * Define the operations that can be performed in a collection.
 * @category Models
 */
export interface Permissions {
    /**
     * Can the user see this collection.
     * If `false` it will not show in the user's navigation
     * Defaults to `true`
     */
    read?: boolean;
    /**
     * Can the user add new entities. Defaults to `true`
     */
    create?: boolean;
    /**
     * Can the elements in this collection be edited. Defaults to `true`
     */
    edit?: boolean;
    /**
     * Can the user delete entities. Defaults to `true`
     */
    delete?: boolean;
}

/**
 * Props passed to a {@link PermissionsBuilder}
 * @category Models
 */
export interface PermissionsBuilderProps<M extends { [Key: string]: any }, UserType extends User = User> {

    /**
     * Path segments of the collection e.g. ['products', 'locales']
     */
    pathSegments: string[];

    /**
     * Logged in user
     */
    user: UserType | null;

    /**
     * Collection these permissions apply to
     */
    collection: EntityCollection<M>;

    /**
     * Auth controller
     */
    authController: AuthController<UserType>;
}

/**
 * Builder used to assign permissions to entities,
 * based on the logged user or collection.
 * @category Models
 */
export type PermissionsBuilder<M extends { [Key: string]: any }, UserType extends User = User> =
    (({
          pathSegments,
          user,
          collection,
          authController
      }: PermissionsBuilderProps<M, UserType>) => Permissions);

export type Role = {

    /**
     * If this flag is true, the user can perform any action
     */
    isAdmin: boolean;

    /**
     * Record of stripped collection paths
     * `products/B44RG6APH/locales` => `products::locales`
     * to their permissions.
     * @see stripCollectionPath
     */
    collections: Record<string, Permissions>;

    /**
     * Is the user allowed to create new collections.
     */
    createCollections?: (params: {
        group?: string
    }) => boolean;

    /**
     * Is the user allowed to modify this collection
     */
    editCollections?: (params: {
        collection: EntityCollection,
        paths: string[]
    }) => boolean;

    /**
     * Is the user allowed to delete this collection
     */
    deleteCollections?: (params: {
        collection: EntityCollection,
        paths: string[]
    }) => boolean;
}
