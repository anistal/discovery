import React, { Component } from 'react'
import { connect } from 'react-redux'
import { replace as replaceAction } from "react-router-redux";
import _ from "underscore";
import cx from "classnames";

import SearchHeader from "metabase/components/SearchHeader";

import type { LocationDescriptor } from "metabase/meta/types";
import Ellipsified from "metabase/components/Ellipsified";
import { caseInsensitiveSearch } from "metabase/lib/string";
import Icon from "metabase/components/Icon";
import TitleAndDescription from "metabase/components/TitleAndDescription";

type Props = {
    // Component parameters
    title: string,
    entities: any[],
    chooseEntity: (any) => void,

    // Properties injected with redux connect
    replace: (location: LocationDescriptor) => void,

    // Injected by withRouter HOC
    location: LocationDescriptor
}

@connect(null, { replace: replaceAction })
export default class EntitySearch extends Component {
    props: Props

    constructor(props) {
        super(props);
        this.state = {
            filteredEntities: props.entities,
            currentGrouping: DEFAULT_SEARCH_GROUPING,
            searchText: ""
        };
    }

    componentWillReceiveProps = (nextProps) => {
        this.applyFiltersForEntities(nextProps.entities)
    }

    setSearchText = (searchText) => {
        // TODO: we maybe want to reflect the search text in the url, at least in new question flow
        // this.props.replace({
        //     pathname: location.pathname,
        //     search: `?search=${searchText}`
        // });
        this.setState({ searchText }, this.applyFiltersAfterFilterChange)
    }

    applyFiltersAfterFilterChange =
        _.debounce(() => this.applyFiltersForEntities(this.props.entities), 200)

    applyFiltersForEntities = (entities) => {
        const { searchText } = this.state;

        if (searchText !== "") {
            const filteredEntities = entities.filter(({ name, description }) =>
                caseInsensitiveSearch(name, searchText) ||
                (description && caseInsensitiveSearch(description, searchText))
            )

            this.setState({ filteredEntities })
        }
        else {
            this.setState({ filteredEntities: entities })
        }
    }

    setGrouping = (grouping) => {
        this.setState({ currentGrouping: grouping })
    }

    render() {
        const { title, chooseEntity } = this.props;
        const { searchText, currentGrouping, filteredEntities } = this.state;

        return (
            <div className="bg-slate-extra-light full Entity-search">
                <div className="wrapper wrapper--small pt4 pb1">
                    <div className="flex mb4 align-center" style={{ height: "50px" }}>
                        <Icon
                            className="Entity-search-back-button shadowed cursor-pointer text-grey-4 mr2 flex align-center circle p2 bg-white transition-background transition-color"
                            style={{
                                border: "1px soli #DCE1E4",
                                boxShadow: "0 2px 4px 0 #DCE1E4"
                            }}
                            name="backArrow"
                            onClick={ () => window.history.back() }
                        />
                        <div className="text-centered flex-full">
                            <h2>{title}</h2>
                        </div>
                    </div>
                    <div className="bg-white">
                        <SearchHeader
                            searchText={searchText}
                            setSearchText={this.setSearchText}
                            autoFocus
                        />
                        <SearchGroupingOptions
                            currentGrouping={currentGrouping}
                            setGrouping={this.setGrouping}
                        />
                        <GroupedSearchResultsList
                            currentGrouping={currentGrouping}
                            entities={filteredEntities}
                            chooseEntity={chooseEntity}
                        />
                    </div>
                </div>
            </div>
        )
    }
}

const SEARCH_GROUPINGS = [
    {
        name: "Name",
        icon: "calendar",
        groupBy: null,
        getGroupName: null
    },
    {
        name: "Table",
        icon: "table",
        groupBy: (entity) => entity.table.id,
        getGroupName: (entity) => entity.table.display_name
    },
    {
        name: "Database",
        icon: "database",
        groupBy: (entity) => entity.table.db.id,
        getGroupName: (entity) => entity.table.db.name
    },
    {
        name: "Creator",
        icon: "mine",
        groupBy: (entity) => entity.creator.id,
        getGroupName: (entity) => entity.creator.common_name
    },
]
const DEFAULT_SEARCH_GROUPING = SEARCH_GROUPINGS[0]

const SearchGroupingOptions = ({ currentGrouping, setGrouping }) =>
    <div className="Entity-search-grouping-options">
        <h3 className="mb3">View by</h3>
        <ul>
            { SEARCH_GROUPINGS.map((groupingOption) =>
                <SearchGroupingOption
                    grouping={groupingOption}
                    active={currentGrouping === groupingOption}
                    setGrouping={setGrouping}
                />
            )}
        </ul>
    </div>

class SearchGroupingOption extends Component {
    props: {
        grouping: any,
        active: boolean,
        setGrouping: (any) => boolean
    }

    onSetGrouping = () => {
        this.props.setGrouping(this.props.grouping)
    }

    render() {
        const { grouping, active } = this.props;

        return (
            <li className={cx("my2 text-uppercase", { "text-brand": active })} onClick={this.onSetGrouping}>
                {grouping.name}
            </li>
        )
    }
}
class GroupedSearchResultsList extends Component {
    props: {
        currentGrouping: any,
        entities: any,
        chooseEntity: (any) => void
    }

    getGroups = () => {
        const { currentGrouping, entities } = this.props;

        if (currentGrouping.groupBy === null) return null;

        return _.chain(entities)
            .groupBy(currentGrouping.groupBy)
            .pairs()
            .map(([groupId, entitiesInGroup]) => ({
                groupName: currentGrouping.getGroupName(entitiesInGroup[0]),
                entitiesInGroup
            }))
            .sortBy(({ groupName }) => groupName.toLowerCase())
            .value()
    }

    render() {
        const { currentGrouping, entities, chooseEntity } = this.props;

        const groups = this.getGroups()

        if (groups) {
            return (
                <div className="full">
                    {this.getGroups().map(({ groupName, entitiesInGroup }) =>
                        <SearchResultsGroup
                            groupName={groupName}
                            groupIcon={currentGrouping.icon}
                            entities={entitiesInGroup}
                            chooseEntity={chooseEntity}
                        />
                    )}
                </div>
            )
        } else {
            // Current grouping seems no-op so just render the results list
            return <SearchResultsList entities={entities} chooseEntity={chooseEntity} />
        }
    }
}

const SearchResultsGroup = ({ groupName, groupIcon, entities }) =>
    <div>
        <div className="flex">
            <Icon className="mr1" name={groupIcon} size={12} />
            <h4>{groupName}</h4>
        </div>
        <SearchResultsList entities={entities} />
    </div>

const SearchResultsList = ({ entities, chooseEntity }) =>
    <ol className="flex-full">
        { _.sortBy(entities, ({ name }) => name.toLowerCase()).map((entity) =>
            <SearchResultListItem entity={entity} chooseEntity={chooseEntity} />
        )}
    </ol>

// const SearchResultListItem = ({ entity, chooseEntity }) => {
class SearchResultListItem extends Component {
    props: {
        entity: any,
        chooseEntity: (any) => void
    }

    onClick = () => {
        const { entity, chooseEntity } = this.props;
        chooseEntity(entity)
    }

    render() {
        const { entity } = this.props;
        const hasDescription = !!entity.description;

        return (
            <div
                className="flex py2 cursor-pointer bg-grey-0-hover"
                onClick={this.onClick}
            >
                <h3 className="text-brand flex-full"> { entity.name } </h3>
                { hasDescription && // take care of cutting off long description
                <div className="text-grey-4" style={{ maxWidth: "450px"}}>
                    <Ellipsified>{ entity.description }</Ellipsified>
                </div>
                }
                { !hasDescription &&
                <div className="text-grey-2"> No description </div>
                }
            </div>
        )
    }
}
