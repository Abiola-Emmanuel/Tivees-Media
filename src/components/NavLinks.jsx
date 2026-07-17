"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'

const getStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  const token = localStorage.getItem('authToken')

  if (typeof token !== 'string') {
    return ''
  }

  return token.replace(/^Bearer\s+/i, '').trim()
}

const unsubscribedLinks = [
  { name: 'Home', href: '/main' },
  { name: 'Movies', href: '/movies' },
  { name: 'Support', href: '/support' },
  { name: 'Subscriptions', href: '/subscriptions' },
]

const subscribedLinks = [
  { name: 'Home', href: '/main' },
  { name: 'Genres', href: '/genres' },
  { name: 'Tags', href: '/tags' },
  { name: 'Support', href: '/support' },
]

const NavLinks = ({
  isSubscribed = false,
  onClick,
  className = '',
  linkClassName = '',
  itemClassName = '',
  renderItem,
}) => {
  const [genres, setGenres] = useState([])
  const [tags, setTags] = useState([])
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [loadingDropdown, setLoadingDropdown] = useState(false)
  const url = process.env.NEXT_PUBLIC_BACKEND_URL

  useEffect(() => {
    if (!isSubscribed) {
      return
    }

    const fetchDropdownData = async () => {
      try {
        setLoadingDropdown(true)
        const authToken = getStoredAuthToken()

        const [genresResponse, tagsResponse] = await Promise.allSettled([
          axios.get(`${url}/api/v1/users/users-moviesGenre`, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          }),
          axios.get(`${url}/api/v1/users/users-moviesTag`, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          }),
        ])

        const parsedGenres = genresResponse.status === 'fulfilled' && Array.isArray(genresResponse.value?.data?.categories)
          ? genresResponse.value.data.categories
          : []
        const parsedTags = tagsResponse.status === 'fulfilled' && Array.isArray(tagsResponse.value?.data?.tags)
          ? tagsResponse.value.data.tags
          : []

        setGenres(parsedGenres)
        setTags(parsedTags)
      } catch (error) {
        console.error('Unable to load nav dropdown data:', error)
      } finally {
        setLoadingDropdown(false)
      }
    }

    fetchDropdownData()
  }, [isSubscribed, url])

  const links = useMemo(() => {
    if (!isSubscribed) {
      return unsubscribedLinks
    }

    return [
      { name: 'Home', href: '/movies' },
      {
        name: 'Genres',
        href: '/genres',
        dropdownItems: genres
          .map((entry) => ({
            label: entry?.category || entry?.genre || entry?.name || '',
          }))
          .filter((item) => item.label),
      },
      {
        name: 'Tags',
        href: '/movies#tags',
      },
      { name: 'Support', href: '/support' },
    ]
  }, [genres, isSubscribed, tags])

  return (
    <>
      {links.map((link, index) => {
        const isDropdownLink = Boolean(link.dropdownItems?.length)
        const content = (
          <div
            className='relative'
            onMouseEnter={() => isDropdownLink && setActiveDropdown(link.name)}
            onMouseLeave={() => isDropdownLink && setActiveDropdown(null)}
          >
            <Link
              href={link.href}
              onClick={onClick}
              className={linkClassName}
              onMouseEnter={() => isDropdownLink && setActiveDropdown(link.name)}
            >
              {link.name}
            </Link>

            {isDropdownLink && activeDropdown === link.name ? (
              <div
                className='absolute left-0 top-full z-[60] mt-2 min-w-[260px] rounded-xl border border-white/10 bg-[#0F0F0F] p-3 text-white shadow-2xl shadow-black/40'
                onMouseEnter={() => setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className='max-h-[320px] overflow-y-auto pr-1'>
                  {loadingDropdown ? (
                    <p className='px-2 py-2 text-sm text-neutral-400'>Loading...</p>
                  ) : link.dropdownItems.length === 0 ? (
                    <p className='px-2 py-2 text-sm text-neutral-400'>No items available.</p>
                  ) : (
                    <div className='flex flex-col gap-1'>
                      {link.dropdownItems.map((item, itemIndex) => {
                        const normalizedLabel = item.label || `item-${itemIndex}`
                        const itemKey = `${link.name}-${normalizedLabel}-${itemIndex}`

                        return (
                          <Link
                            key={itemKey}
                            href={link.name === 'Genres' ? `/${encodeURIComponent(normalizedLabel)}` : `/${encodeURIComponent(normalizedLabel)}`}
                            onClick={onClick}
                            className='rounded-md px-2 py-1 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-white'
                          >
                            {normalizedLabel}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )

        if (renderItem) {
          return renderItem({ link, index, children: content })
        }

        return (
          <div key={link.href} className={itemClassName}>
            {content}
          </div>
        )
      })}
    </>
  )
}

export default NavLinks
