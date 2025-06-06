import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { AuthProvider } from '@/contexts/authContext'

const StackLayout = () => {
    return <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
            name='(modals)/profileModal.tsx'
            options={{
                presentation: 'modal',
            }}
        />
        <Stack.Screen
            name='(modals)/walletModal.tsx'
            options={{
                presentation: 'modal',
            }}
        />
        <Stack.Screen
            name='(modals)/transactionModal.tsx'
            options={{
                presentation: 'modal',
            }}
        />
        <Stack.Screen
            name='(modals)/searchModal.tsx'
            options={{
                presentation: 'modal',
            }}
        />
    </Stack>
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <StackLayout />
        </AuthProvider>
    )
}

const styles = StyleSheet.create({})