import axios from "axios";
import React from "react";
import ThreadCard from "../components/ThreadCard";
import ThreadPage from "../pages/ThreadPage";
import UserDropdown from "../components/UserDropdown";
import InviteMemberPopup from "../components/InviteMemberPopup";
import NewThread from "../components/NewThread";
import ReportButton from "../components/ReportButton";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const targetType = 3;

class GroupPage extends React.Component {
	static contextType = AuthContext;

	constructor(props) {
		super(props);
		this.state = {
			members: [],
			member: null,
			group: { title: "", description: "" },
			loggedInUser: this.props.loggedInUser,
			loggedInMember: { role: null },
			threads: {},
			usersBlacklist: [],
			clickedThread: 0,
			invitePopup: false,
			toggleNewThread: false,
			isAdmin: false,
			isBlacklisted: true,
			isMember: true,
			reload: false,
		};
		this.handleThreadClick = this.handleThreadClick.bind(this);
		this.unlockMember = this.unlockMember.bind(this);
		this.toggleNewThread = this.toggleNewThread.bind(this);
		this.fetchThreads = this.fetchThreads.bind(this);
		this.reloadPage = this.reloadPage.bind(this);
		this.toggleInviteMember = this.toggleInviteMember.bind(this);
		this.createMember = this.createMember.bind(this);
		this.toggleInviteMember = this.toggleInviteMember.bind(this);
		this.fetchMembers = this.fetchMembers.bind(this);
		this.fetchBlackList = this.fetchBlackList.bind(this);
		this.returnToGroup = this.returnToGroup.bind(this);
		this.fetchAll = this.fetchAll.bind(this);
	}

	async componentDidUpdate(prevProps) {
		if(this.props.loggedInUser !== prevProps.loggedInUser) {
			await this.fetchAll();
		}
	}

	async componentDidMount() {
		// Fetch all group stuff if user is already logged in. Otherwise do it in componentDidUpdate.
		if (this.props.loggedInUser.id) {
			await this.fetchAll();
		}
	}

	async fetchAll() {
		let groupId = window.location.href.substring(
			window.location.href.lastIndexOf("/") + 1
		);

		//Kör dessa först för att få rätt memberId när en bjuder in till gruppen
		const [firstResponse, secondResponse, thirdResponse] = await Promise.all([
			axios.get("/rest/groups/getGroupBy/" + groupId),
			axios.get("/rest/member/memberByGroupId/" + groupId),
			axios.get("/rest/threads/byGroup/" + groupId),
		]);

		this.setState({group: firstResponse.data[0]})

		const fourthResponse = await axios.get(
			"/rest/member/getMemberByIdUserId/" +
				this.props.loggedInUser.id +
				"/" +
				firstResponse.data[0].id
		);

		this.setState(
			(prevState) => {
				this.fetchBlackList();
				let loggedInMember = prevState.loggedInMember;
				if (typeof fourthResponse.data !== "undefined") {
					loggedInMember = fourthResponse.data;
					let usersBlacklist;
				}
				return { loggedInMember };
			},
			() => {
				const isBlacklisted = this.state.usersBlacklist.some((element) => {
					if (element.username === this.state.loggedInMember.username) {
						return true;
					} else {
						return false;
					}
				});
				this.setState({ isBlacklisted });

				if (
					typeof this.state.loggedInMember.role !== "undefined" &&
					this.state.loggedInMember.role !== null &&
					!isBlacklisted || this.state.isAdmin
				) {
					{
						this.setState({
							members: secondResponse.data,
							threads: thirdResponse.data,
							isMember: false,
						});
					}
				}
			}
		);
	}

	fetchMembers() {
		axios
			.get("/rest/member/memberByGroupId/" + this.state.group.id)
			.then((response) => {
				this.setState({ members: response.data });
			});
	}

	createMember() {
		let member = {
			user: { id: this.state.loggedInUser.id },
			memberRole: { id: 4 }, // id av "user" i Tabellen member_roles i Databasen.
			group: {
				id: window.location.href.substring(
					window.location.href.lastIndexOf("/") + 1
				),
			},
		};

		this.setState({ member }, () => {
			axios.post("/rest/member/join", this.state.member).then((response) => {
				alert(response.data);
				//window.location.reload();
				this.fetchMembers();
			});
		});
	}

	toggleInviteMember() {
		this.setState({ invitePopup: !this.state.invitePopup });
	}
	unlockMember(userId) {
		if (
			window.confirm(
				"Är du säker på att du vill avblockera den här användaren?"
			)
		) {
			axios
				.delete(
					"/rest/member/deleteUserBlacklist/" +
						userId +
						"/" +
						window.location.href.substring(
							window.location.href.lastIndexOf("/") + 1
						)
				)
				.then((response) => {
					this.fetchMembers();
					this.fetchBlackList();
				});
		}
	}

	fetchBlackList() {
		let groupId = window.location.href.substring(
			window.location.href.lastIndexOf("/") + 1
		);
		let usersBlacklist;
		axios
			.get("/rest/balcklistByGroupId/" + groupId)
			.then((response) => response.data)
			.then((data) => {
				usersBlacklist = data;
				this.setState({ usersBlacklist });
			});
	}

	RenderMembers(props, loggedInMember, isAdmin, fetchMembers) {
		let members = Object.values(props);
		let membersList = [];
		for (let i = 0; i < members.length; i++) {
			membersList.push(
				<UserDropdown
					user={members[i]}
					key={i}
					loggedInMember={loggedInMember}
					isAdmin={isAdmin}
					fetchMembers={fetchMembers}
					fetchBlackList={this.fetchBlackList}
				/>
			);
		}
		return membersList;
	}

	toggleNewThread(value) {
		this.setState({ toggleNewThread: value });
		if (value) {
			document.querySelector("html").style.overflow = "hidden";
		} else {
			document.querySelector("html").style.overflow = "auto";
		}
	}

	handleThreadClick(props) {
		let clickedThread = props;
		this.setState({ clickedThread });
	}

	fetchThreads() {
		if (
			typeof this.state.loggedInMember.role !== "undefined" &&
			this.state.loggedInMember.role !== ""
		) {
			let threads;
			axios
				.get("/rest/threads/byGroup/" + this.state.group.id)
				.then((response) => response.data)
				.then((data) => {
					threads = data;
					this.setState({ threads });
				});
		}
	}

	reloadPage() {
		this.setState({ reload: true });
	}

	returnToGroup() {
		console.log("WHAT")
		this.setState({clickedThread: 0})
	}

	render() {
		if (this.state.reload) {
			return <Navigate to="/home" />;
		} else {

			let group = this.state.group;
			let reportButton = null;
			if(group.user_id) {
				reportButton = <ReportButton customText="Report this group" targetType={ targetType } targetId={ group.user_id } targetObj={ group } />
			}

			return (
				<div className="group-page">
					<div
						className="group-overlay"
						style={{ display: this.state.toggleNewThread ? "block" : "none" }}
					>
						<NewThread
							cancelPost={this.toggleNewThread}
							groupId={this.state.group.id}
							loggedInUser={this.state.loggedInUser}
							fetchThreads={this.fetchThreads}
						/>
					</div>

					<div className="group-posts">
						{ShowThread(
							this.state.threads,
							this.handleThreadClick,
							this.state.clickedThread,
							this.state.loggedInUser,
							this.fetchThreads,
							this.state.isAdmin,
							this.returnToGroup
						)}
					</div>

					<div className="group-side-panel">
						{this.state.invitePopup ? (
							<InviteMemberPopup
								toggleProps={this.toggleInviteMember}
								loggedInUser={this.state.loggedInUser}
								groupId={this.state.group}
								memberId={this.state.loggedInMember}
							/>
						) : null}
						<div className="group-info">
							<h3>{this.state.group.title}</h3>
							<p>{this.state.group.description}</p>
							{RemoveGroupButton(
								this.state.isAdmin,
								this.state.loggedInMember,
								this.state.group,
								this.reloadPage
							)}
							{MemberButton(
								this.state.loggedInMember,
								this.createMember,
								this.toggleInviteMember,
								this.state.isBlacklisted
							)}
						</div>
						<div
							className="group-members"
							style={{
								display: this.state.isBlacklisted ? "none" : "block",
							}}
						>
							{this.RenderMembers(
								this.state.members,
								this.state.loggedInMember,
								this.state.isAdmin,
								this.fetchMembers
							)}
						</div>
						<div>
							{CheckLoggedInMemberRole(
								this.state.loggedInMember,
								this.state.usersBlacklist,
								this.unlockMember
							)}
						</div>
						<button
							className="group-new-thread"
							style={{
								display: this.state.isMember ? "none" : "block",
							}}
							onClick={() => this.toggleNewThread(true)}
						>
							Skapa nytt inlägg
						</button>
						<div
							style={{
								display: this.state.isMember ? "none" : "block",
							}}
						>
							<ReportButton
								customText="Report this group"
								targetType={targetType}
								targetId={window.location.href.substring(
									window.location.href.lastIndexOf("/") + 1
								)}
							/>
						</div>
					</div>
				</div>
			);
		}
	}
}

function MemberButton(role, createMember, toggleInvite, isBlacklisted) {
	if (!isBlacklisted) {
		if (role.role === null || typeof role.role === "undefined") {
			return <button onClick={() => createMember()}>Bli medlem</button>;
		} else {
			return <button onClick={() => toggleInvite()}>Bjud in medlem</button>;
		}
	}
}

function RemoveGroupButton(isAdmin, role, group, reloadPage) {
	if (isAdmin || role.role === "GROUPADMIN") {
		function removeGroup() {
			if (
				window.confirm(
					"Är du säker på att du vill ta bort denna gruppen: " + group.title
				)
			)
				axios.put("/rest/groups/deleteGroup/" + group.id).then((response) => {
					alert("Grupp med namnet: " + group.title + " har tagits bort");
					reloadPage();
				});
		}
		return (
			<button className="group-delete" onClick={removeGroup}>
				Ta bort grupp
			</button>
		);
	} else {
		return <></>;
	}
}

function CheckLoggedInMemberRole(loggedinMember, usersBlacklist, unlockMember) {
	let div;
	if (
		loggedinMember.role === "GROUPADMIN" ||
		loggedinMember.role === "GROUPMODERATOR"
	) {
		div = (
			<div className="group-members-blacklist">
				<h6 className="blocked-users">
					Blockerade användare i den här gruppen:
				</h6>
				<div className="blacklist-list">
					{usersBlacklist.map((blacklist) => (
						<ul className="blacklist-ul" key={blacklist.id}>
							<li className="blacklist-members">
								<button onClick={() => unlockMember(blacklist.id)}>
									Aktivera
								</button>
								<span className="blacklist-user">{blacklist.username} - </span>
								<span className="blacklist-date">{blacklist.to_date}</span>
							</li>
						</ul>
					))}
				</div>
			</div>
		);
	} else {
		div = <div></div>;
	}
	return div;
}

function ShowThread(
	threads,
	handleThreadClick,
	clickedThread,
	loggedInUser,
	fetchThreads,
	isAdmin,
	returnToGroup
) {
	if (clickedThread === 0) {
		return (
			<>
				{RenderThreads(
					threads,
					handleThreadClick,
					loggedInUser,
					fetchThreads,
					isAdmin
				)}
			</>
		);
	} else {
		return (
			<>
				<button className="group-back-button" onClick={() => returnToGroup()}>Tillbaka</button>
				<ThreadPage
					threadId={clickedThread}
					loggedInUser={loggedInUser}
					showCommentButton={true}
					fetchThreads={fetchThreads}
					isAdmin={isAdmin}
				/>
			</>
		);
	}
}

function RenderThreads(
	props,
	handleThreadClick,
	loggedInUser,
	fetchThreads,
	isAdmin
) {
	if (props !== null) {
		let threads = Object.values(props);
		let threadList = [];
		for (let i = threads.length - 1; i >= 0; i--) {
			threadList.push(
				<ThreadCard
					thread={threads[i]}
					key={i}
					handleThreadClick={(e) => handleThreadClick(e)}
					loggedInUser={loggedInUser}
					showCommentButton={false}
					fetchThreads={fetchThreads}
					isAdmin={isAdmin}
				/>
			);
		}
		return threadList;
	} else return null;
}
export default GroupPage;
