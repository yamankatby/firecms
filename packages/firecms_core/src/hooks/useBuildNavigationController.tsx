import { useCallback, useEffect, useRef, useState } from "react";
import equal from "react-fast-compare"

import {
    AuthController,
    CMSView,
    CMSViewsBuilder,
    DataSourceDelegate,
    EntityCollection,
    EntityCollectionsBuilder,
    EntityReference,
    NavigationController,
    TopNavigationEntry,
    TopNavigationResult,
    User,
    UserConfigurationPersistence
} from "../types";
import {
    getCollectionByPathOrId,
    mergeDeep,
    removeInitialAndTrailingSlashes,
    resolveCollectionPathIds,
    resolvePermissions
} from "../util";
import { getParentReferencesFromPath } from "../util/parent_references_from_path";

const DEFAULT_BASE_PATH = "/";
const DEFAULT_COLLECTION_PATH = "/c";

type BuildNavigationContextProps<EC extends EntityCollection, UserType extends User> = {
    basePath?: string,
    baseCollectionPath?: string,
    authController: AuthController<UserType>;
    collections?: EC[] | EntityCollectionsBuilder<EC>;
    views?: CMSView[] | CMSViewsBuilder;
    userConfigPersistence?: UserConfigurationPersistence;
    dataSourceDelegate: DataSourceDelegate;
    /**
     * Use this method to inject collections to the CMS.
     * You receive the current collections as a parameter, and you can return
     * a new list of collections.
     * @see {@link joinCollectionLists}
     * @param collections
     */
    injectCollections?: (collections: EntityCollection[]) => EntityCollection[];
};

export function useBuildNavigationController<EC extends EntityCollection, UserType extends User>({
                                                                                                     basePath = DEFAULT_BASE_PATH,
                                                                                                     baseCollectionPath = DEFAULT_COLLECTION_PATH,
                                                                                                     authController,
                                                                                                     collections: collectionsProp,
                                                                                                     views: baseViews,
                                                                                                     userConfigPersistence,
                                                                                                     dataSourceDelegate,
                                                                                                     injectCollections
                                                                                                 }: BuildNavigationContextProps<EC, UserType>): NavigationController {

    const collectionsRef = useRef<EntityCollection[] | null>();
    const [collections, setCollections] = useState<EntityCollection[] | undefined>();
    const [views, setViews] = useState<CMSView[] | undefined>();
    const [initialised, setInitialised] = useState<boolean>(false);

    const [topLevelNavigation, setTopLevelNavigation] = useState<TopNavigationResult | undefined>(undefined);
    const [navigationLoading, setNavigationLoading] = useState<boolean>(true);
    const [navigationLoadingError, setNavigationLoadingError] = useState<Error | undefined>(undefined);

    const cleanBasePath = removeInitialAndTrailingSlashes(basePath);
    const cleanBaseCollectionPath = removeInitialAndTrailingSlashes(baseCollectionPath);

    const homeUrl = cleanBasePath ? `/${cleanBasePath}` : "/";

    const fullCollectionPath = cleanBasePath ? `/${cleanBasePath}/${cleanBaseCollectionPath}` : `/${cleanBaseCollectionPath}`;

    const buildCMSUrlPath = useCallback((path: string): string => cleanBasePath ? `/${cleanBasePath}/${encodePath(path)}` : `/${encodePath(path)}`,
        [cleanBasePath]);

    const buildUrlCollectionPath = useCallback((path: string): string => `${removeInitialAndTrailingSlashes(baseCollectionPath)}/${encodePath(path)}`,
        [baseCollectionPath]);

    const computeTopNavigation = useCallback((collections: EntityCollection[], views: CMSView[]): TopNavigationResult => {
        const navigationEntries: TopNavigationEntry[] = [
            ...(collections ?? []).map(collection => (!collection.hideFromNavigation
                ? {
                    url: buildUrlCollectionPath(collection.id ?? collection.path),
                    type: "collection",
                    name: collection.name.trim(),
                    path: collection.id ?? collection.path,
                    collection,
                    description: collection.description?.trim(),
                    group: collection.group?.trim()
                }
                : undefined))
                .filter(Boolean) as TopNavigationEntry[],
            ...(views ?? []).map(view =>
                !view.hideFromNavigation
                    ? ({
                        url: buildCMSUrlPath(Array.isArray(view.path) ? view.path[0] : view.path),
                        name: view.name.trim(),
                        type: "view",
                        view,
                        description: view.description?.trim(),
                        group: view.group?.trim()
                    })
                    : undefined)
                .filter(Boolean) as TopNavigationEntry[]
        ];

        const groups: string[] = Object.values(navigationEntries)
            .map(e => e.group)
            .filter(Boolean)
            .filter((value, index, array) => array.indexOf(value) === index) as string[];
        return {
            navigationEntries,
            groups
        };
    }, [buildCMSUrlPath, buildUrlCollectionPath]);

    const refreshNavigation = useCallback(async () => {

        if (authController.initialLoading)
            return;

        try {
            const [resolvedCollections = [], resolvedViews = []] = await Promise.all([
                    resolveCollections(collectionsProp, authController, dataSourceDelegate, injectCollections),
                    resolveCMSViews(baseViews, authController, dataSourceDelegate)
                ]
            );
            if (!equal(collectionsRef.current, resolvedCollections) || !equal(views, resolvedViews) || !equal(topLevelNavigation, computeTopNavigation(resolvedCollections, resolvedViews))) {
                collectionsRef.current = resolvedCollections;
                setCollections(resolvedCollections);
                setViews(resolvedViews);
                setTopLevelNavigation(computeTopNavigation(resolvedCollections ?? [], resolvedViews));
            }
        } catch (e) {
            console.error(e);
            setNavigationLoadingError(e as any);
        }

        setNavigationLoading(false);
        setInitialised(true);
    }, [collectionsProp, authController.user, authController.initialLoading, baseViews, computeTopNavigation, injectCollections]);

    useEffect(() => {
        refreshNavigation();
    }, [refreshNavigation]);

    const getCollection = useCallback(<EC extends EntityCollection>(
        idOrPath: string,
        entityId?: string,
        includeUserOverride = false
    ): EC | undefined => {

        if (!collections)
            return undefined;

        const baseCollection = getCollectionByPathOrId(removeInitialAndTrailingSlashes(idOrPath), collections);

        const userOverride = includeUserOverride ? userConfigPersistence?.getCollectionConfig(idOrPath) : undefined;

        const overriddenCollection = baseCollection ? mergeDeep(baseCollection, userOverride) : undefined;

        let result: Partial<EntityCollection> | undefined = overriddenCollection;

        if (overriddenCollection) {
            const subcollections = overriddenCollection.subcollections;
            const callbacks = overriddenCollection.callbacks;
            const permissions = overriddenCollection.permissions;
            result = {
                ...result,
                subcollections: result?.subcollections ?? subcollections,
                callbacks: result?.callbacks ?? callbacks,
                permissions: result?.permissions ?? permissions
            };
        }

        if (!result) return undefined;

        return { ...overriddenCollection, ...result } as EC;

    }, [
        basePath,
        baseCollectionPath,
        collections,
    ]);

    const getCollectionFromPaths = useCallback(<EC extends EntityCollection>(pathSegments: string[]): EC | undefined => {
        let currentCollections = collections;
        if (!currentCollections)
            throw Error("Collections have not been initialised yet");

        for (let i = 0; i < pathSegments.length; i++) {
            const pathSegment = pathSegments[i];
            const collection: EntityCollection | undefined = currentCollections!.find(c => c.id === pathSegment || c.path === pathSegment);
            if (!collection)
                return undefined;
            currentCollections = collection.subcollections;
            if (i === pathSegments.length - 1)
                return collection as EC;
        }

        return undefined;

    }, [collections]);

    const getCollectionFromIds = useCallback(<EC extends EntityCollection>(ids: string[]): EC | undefined => {
        let currentCollections = collections;
        if (!currentCollections)
            throw Error("Collections have not been initialised yet");

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const collection: EntityCollection | undefined = currentCollections!.find(c => c.id === id);
            if (!collection)
                return undefined;
            currentCollections = collection.subcollections;
            if (i === ids.length - 1)
                return collection as EC;
        }

        return undefined;

    }, [collections]);

    const isUrlCollectionPath = useCallback(
        (path: string): boolean => removeInitialAndTrailingSlashes(path + "/").startsWith(removeInitialAndTrailingSlashes(fullCollectionPath) + "/"),
        [fullCollectionPath]);

    const urlPathToDataPath = useCallback((path: string): string => {
        if (path.startsWith(fullCollectionPath))
            return path.replace(fullCollectionPath, "");
        throw Error("Expected path starting with " + fullCollectionPath);
    }, [fullCollectionPath]);

    const buildUrlEditCollectionPath = useCallback(({
                                                        path
                                                    }: {
            path: string
        }): string => {
            return `s/edit/${encodePath(path)}`;
        },
        []);

    const resolveAliasesFrom = useCallback((path: string): string => {
        if (!collections)
            throw Error("Collections have not been initialised yet");
        return resolveCollectionPathIds(path, collections);
    }, [collections]);

    const getAllParentReferencesForPath = useCallback((path: string): EntityReference[] => {
        return getParentReferencesFromPath({
            path,
            collections
        });
    }, [collections]);

    const getParentCollectionIds = useCallback((path: string): string[] => {

        const strings = path.split("/");
        const oddPathSegments = strings.filter((_, i) => i % 2 === 0);
        oddPathSegments.pop();

        const result: string[][] = [];

        for (let i = 1; i <= oddPathSegments.length; i++) {
            result.push(oddPathSegments.slice(0, i));
        }

        // for each odd path segment, get the collection
        return result.map(r => getCollectionFromPaths(r)?.id).filter(Boolean) as string[];
    }, [getAllParentReferencesForPath])

    const convertIdsToPaths = useCallback((ids: string[]): string[] => {
            let currentCollections = collections;
            const paths: string[] = [];
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const collection: EntityCollection | undefined = currentCollections!.find(c => c.id === id);
                if (!collection)
                    throw Error(`Collection with id ${id} not found`);
                paths.push(collection.path);
                currentCollections = collection.subcollections;
            }
            return paths;
        }
        , [getCollectionFromIds]);

    return {
        collections,
        views,
        loading: !initialised || navigationLoading,
        navigationLoadingError,
        homeUrl,
        basePath,
        baseCollectionPath,
        initialised,
        getCollection,
        getCollectionFromPaths,
        getCollectionFromIds,
        isUrlCollectionPath,
        urlPathToDataPath,
        buildUrlCollectionPath,
        buildUrlEditCollectionPath,
        buildCMSUrlPath,
        resolveAliasesFrom,
        topLevelNavigation,
        refreshNavigation,
        getParentReferencesFromPath: getAllParentReferencesForPath,
        getParentCollectionIds,
        convertIdsToPaths
    };
}

export function getSidePanelKey(path: string, entityId?: string) {
    if (entityId)
        return `${removeInitialAndTrailingSlashes(path)}/${removeInitialAndTrailingSlashes(entityId)}`;
    else
        return removeInitialAndTrailingSlashes(path);
}

function encodePath(input: string) {
    return encodeURIComponent(removeInitialAndTrailingSlashes(input))
        .replaceAll("%2F", "/")
        .replaceAll("%23", "#");
}

function filterOutNotAllowedCollections(resolvedCollections: EntityCollection[], authController: AuthController<User>): EntityCollection[] {
    return resolvedCollections
        .filter((c) => {
            if (!c.permissions) return true;
            const resolvedPermissions = resolvePermissions(c, authController, [c.path], null,)
            return resolvedPermissions.read !== false;
        })
        .map((c) => {
            if (!c.subcollections) return c;
            return {
                ...c,
                subcollections: filterOutNotAllowedCollections(c.subcollections, authController)
            }
        });
}

async function resolveCollections(collections: undefined | EntityCollection[] | EntityCollectionsBuilder<any>,
                                  authController: AuthController,
                                  dataSource: DataSourceDelegate,
                                  injectCollections?: (collections: EntityCollection[]) => EntityCollection[]) {
    let resolvedCollections: EntityCollection[] = [];
    if (typeof collections === "function") {
        resolvedCollections = await collections({
            user: authController.user,
            authController,
            dataSource
        });
    } else if (Array.isArray(collections)) {
        resolvedCollections = collections;
    }

    resolvedCollections = filterOutNotAllowedCollections(resolvedCollections, authController);

    if (injectCollections) {
        resolvedCollections = injectCollections(resolvedCollections ?? []);
    }

    return resolvedCollections;
}

async function resolveCMSViews(baseViews: CMSView[] | CMSViewsBuilder | undefined, authController: AuthController, dataSource: DataSourceDelegate) {
    let resolvedViews: CMSView[] = [];
    if (typeof baseViews === "function") {
        resolvedViews = await baseViews({
            user: authController.user,
            authController,
            dataSource
        });
    } else if (Array.isArray(baseViews)) {
        resolvedViews = baseViews;
    }
    return resolvedViews;
}
