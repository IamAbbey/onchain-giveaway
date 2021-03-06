import { ConnectButton } from "web3uikit";
import Link from "next/link";

export default function Header() {
  return (
    <nav className="p-5 border-b-2 flex flex-row">
      <div className="navbar bg-base-100">
        <div className="navbar-start">
          <div className="dropdown">
            <label tabIndex="0" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </label>
            <ul
              tabIndex="0"
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <Link href="/">
                  <a>Home</a>
                </Link>
              </li>
              <li>
                <Link href="/add-new">
                  <a>Add New</a>
                </Link>
              </li>
              <li>
                <Link href="/add-new">
                  <a>My Stakes</a>
                </Link>
              </li>
            </ul>
          </div>
          <a className="sm:text-2xl text-base">Giveaway DApp</a>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal p-0">
            <li>
              <Link href="/">
                <a>Home</a>
              </Link>
            </li>
            <li>
              <Link href="/add-new">
                <a>Add New</a>
              </Link>
            </li>
            <li>
              <Link href="/transactions">
                <a>My Stakes</a>
              </Link>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          <ConnectButton moralisAuth={false} />
        </div>
      </div>
    </nav>
  );
}
