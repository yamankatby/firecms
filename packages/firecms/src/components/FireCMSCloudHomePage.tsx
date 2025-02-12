import React from "react";
import {
    DefaultHomePage,
    IconForView,
    NavigationGroup,
    useCustomizationController,
    useNavigationController
} from "@firecms/core";
import { ArrowForwardIcon, cardClickableMixin, cardMixin, cn, focusedMixin, Typography, } from "@firecms/ui";

import { Link as ReactLink } from "react-router-dom";
import { SubscriptionPlanWidget } from "./subscriptions";
import { ADMIN_VIEWS_CONFIG } from "../utils";

/**
 * Default entry view for the CMS under the path "/"
 * This component takes navigation as an input and renders cards
 * for each entry, including title and description.
 * @constructor
 * @group Components
 */
export function FireCMSCloudHomePage() {

    const navigation = useNavigationController();
    const { plugins } = useCustomizationController();

    const pluginActions: React.ReactNode[] = [];
    if (plugins) {
        pluginActions.push(...plugins.map((plugin, i) => (
            <React.Fragment key={plugin.name}>{plugin.homePage?.additionalActions ?? null}</React.Fragment>
        )).filter(Boolean));
    }
    return <DefaultHomePage
        additionalActions={<> {pluginActions} </>}
        additionalChildrenStart={(navigation.collections ?? []).length > 0
            ? <SubscriptionPlanWidget showForPlans={["free"]}/>
            : undefined}
        additionalChildrenEnd={
            <NavigationGroup group={"ADMIN"}>
                <div className={"grid grid-cols-12 gap-2"}>
                    {ADMIN_VIEWS_CONFIG.map((view) => <div className={"col-span-12 sm:col-span-6 lg:col-span-4"}
                                                          key={`nav_${view.path}`}>
                        <NavigationCircularCard
                            name={view.name}
                            url={view.path}
                            icon={<IconForView collectionOrView={view}
                                               className={"text-gray-400 dark:text-gray-600"}/>}/>
                    </div>)}
                </div>
            </NavigationGroup>
        }/>;
}

type NavigationCardProps = {
    name: string,
    description?: string;
    url: string;
    icon: React.ReactElement;
    onDelete?: () => void,
    onEdit?: () => void
};

function NavigationCircularCard({
                                    name,
                                    url,
                                    icon,
                                }: NavigationCardProps) {

    return (
        <>

            <ReactLink
                tabIndex={0}
                className={cn(cardMixin,
                    cardClickableMixin,
                    focusedMixin,
                    "cursor-pointer flex flex-row items-center px-4 py-2 text-inherit dark:text-inherit visited:text-inherit visited:dark:text-inherit hover:text-inherit hover:dark:text-inherit ")}
                to={url}
            >

                <div className="flex flex-row items-center flex-grow gap-2 ">
                    {icon}

                    <Typography gutterBottom variant="h5"
                                component="h2"
                                className="mb-0 ml-4">
                        {name}
                    </Typography>
                </div>

                <div className={"p-4"}>
                    <ArrowForwardIcon color="primary"/>
                </div>
            </ReactLink>

        </>);
}
